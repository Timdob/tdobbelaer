import dotenv from 'dotenv'
import fs from 'fs/promises'
import pg from 'pg'

dotenv.config()

const { Pool } = pg
const pool = new Pool({
  host: process.env.DUMP_HOST || process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

const q = (text, params) => pool.query(text, params)

async function getTableNames() {
  const r = await q(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `)
  return r.rows.map((row) => row.tablename)
}

async function getTableDDL(table) {
  // Get columns
  const cols = await q(`
    SELECT
      a.attname AS col,
      pg_catalog.format_type(a.atttypid, a.atttypmod) AS type,
      a.attnotnull AS notnull,
      pg_get_expr(d.adbin, d.adrelid) AS default_val
    FROM pg_attribute a
    LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
    WHERE a.attrelid = $1::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped
    ORDER BY a.attnum
  `, [table])

  // Get constraints
  const constraints = await q(`
    SELECT conname, contype, pg_get_constraintdef(oid) AS def
    FROM pg_constraint
    WHERE conrelid = $1::regclass
    ORDER BY contype, conname
  `, [table])

  // Get indexes (exclude primary key, already in constraints)
  const indexes = await q(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = $1
      AND schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
    ORDER BY indexname
  `, [table])

  const colLines = cols.rows.map((c) => {
    let line = `  ${c.col} ${c.type}`
    if (c.default_val) line += ` DEFAULT ${c.default_val}`
    if (c.notnull) line += ' NOT NULL'
    return line
  })

  // Skip auto-generated NOT NULL constraints — already expressed in column definitions
  const constraintLines = constraints.rows
    .filter((c) => !c.conname.endsWith('_not_null'))
    .map((c) => `  CONSTRAINT ${c.conname} ${c.def}`)

  const allLines = [...colLines, ...constraintLines]
  let ddl = `CREATE TABLE IF NOT EXISTS ${table} (\n${allLines.join(',\n')}\n);\n`

  for (const idx of indexes.rows) {
    ddl += `${idx.indexdef};\n`
  }

  return ddl
}

// Kolommen die nooit in een dump-bestand mogen staan
const SENSITIVE_COLS = new Set(['mail_password', 'password_hash'])

async function getTableData(table) {
  const r = await q(`SELECT * FROM ${table} ORDER BY id`)
  if (!r.rows.length) return ''

  const cols = Object.keys(r.rows[0])
  const lines = r.rows.map((row) => {
    const values = cols.map((col) => {
      if (SENSITIVE_COLS.has(col)) return `'__REPLACE_ME__'`
      const v = row[col]
      if (v === null) return 'NULL'
      if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE'
      if (typeof v === 'number') return String(v)
      if (v instanceof Date) return `'${v.toISOString()}'`
      if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`
      return `'${String(v).replace(/'/g, "''")}'`
    })
    return `(${values.join(', ')})`
  })

  return `INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${lines.join(',\n')};\n`
}

async function dump() {
  const tables = await getTableNames()
  console.log('Tables found:', tables.join(', '))

  let sql = `-- TD Development — volledige DB dump\n-- Gegenereerd: ${new Date().toISOString()}\n-- Host: ${process.env.DUMP_HOST || process.env.DB_HOST}\n\n`
  sql += `SET client_encoding = 'UTF8';\n`
  sql += `SET standard_conforming_strings = on;\n\n`

  // Drop order (FK-safe)
  const dropOrder = [
    'chat_messages', 'chat_sessions',
    'contact_messages',
    'services', 'users', 'customers',
    'media',
    'homepage_blocks', 'hero_slides', 'packages', 'pages',
    'mail_templates', 'site_settings',
    ...tables.filter((t) => ![
      'chat_messages','chat_sessions','contact_messages',
      'services','users','customers','media',
      'homepage_blocks','hero_slides','packages','pages',
      'mail_templates','site_settings',
    ].includes(t)),
  ].filter((t) => tables.includes(t))

  sql += `-- DROP (FK-veilige volgorde)\n`
  for (const t of [...dropOrder].reverse()) {
    sql += `DROP TABLE IF EXISTS ${t} CASCADE;\n`
  }
  sql += `\n`

  // Schema
  sql += `-- SCHEMA\n`
  for (const t of dropOrder) {
    sql += `\n-- Table: ${t}\n`
    sql += await getTableDDL(t)
  }
  sql += `\n`

  // Data (skip users passwords blijven gehasht — dat is fine)
  sql += `-- DATA\n`
  for (const t of dropOrder) {
    const data = await getTableData(t)
    if (data) {
      sql += `\n-- Data: ${t}\n`
      sql += data
    }
  }

  // Sequences resetten
  sql += `\n-- SEQUENCES herstellen\n`
  for (const t of dropOrder) {
    try {
      const pkCol = await q(`
        SELECT a.attname FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = $1::regclass AND i.indisprimary
      `, [t])
      if (pkCol.rows[0]?.attname === 'id') {
        sql += `SELECT setval(pg_get_serial_sequence('${t}', 'id'), COALESCE((SELECT MAX(id) FROM ${t}), 1));\n`
      }
    } catch {}
  }

  await fs.writeFile('scripts/full_dump.sql', sql, 'utf8')
  console.log('Dump geschreven naar scripts/full_dump.sql')
}

dump().catch((e) => { console.error(e); process.exitCode = 1 }).finally(() => pool.end())
