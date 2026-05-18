const { Pool } = require('pg')
require('dotenv').config()

const p = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  connectionTimeoutMillis: 8000,
})

;(async () => {
  await p.query("alter table site_settings add column if not exists chat_enabled boolean not null default false")
  await p.query("alter table site_settings add column if not exists chat_welcome text not null default 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.'")

  await p.query(`create table if not exists chat_sessions (
    id serial primary key,
    visitor_id text not null,
    visitor_name text not null default '',
    visitor_email text not null default '',
    status text not null default 'open',
    last_message_at timestamptz not null default now(),
    admin_unread integer not null default 0,
    visitor_unread integer not null default 0,
    created_at timestamptz not null default now()
  )`)
  await p.query('create index if not exists chat_sessions_visitor_idx on chat_sessions (visitor_id)')
  await p.query('create index if not exists chat_sessions_last_idx on chat_sessions (last_message_at desc)')

  await p.query(`create table if not exists chat_messages (
    id serial primary key,
    session_id integer not null references chat_sessions(id) on delete cascade,
    role text not null,
    body text not null,
    attachment_url text not null default '',
    attachment_type text not null default '',
    attachment_name text not null default '',
    created_at timestamptz not null default now()
  )`)
  await p.query("alter table if exists chat_messages add column if not exists attachment_url text not null default ''")
  await p.query("alter table if exists chat_messages add column if not exists attachment_type text not null default ''")
  await p.query("alter table if exists chat_messages add column if not exists attachment_name text not null default ''")
  await p.query('create index if not exists chat_messages_session_idx on chat_messages (session_id, created_at)')

  console.log('Chat tables + columns ready')
  process.exit(0)
})().catch((e) => { console.error('ERR', e.message); process.exit(1) })
