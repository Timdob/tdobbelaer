import { createServer } from 'node:http'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Server as SocketServer } from 'socket.io'

dotenv.config()

const { Pool } = pg
const app = express()
const httpServer = createServer(app)
const io = new SocketServer(httpServer, { cors: { origin: '*' } })
const port = Number(process.env.API_PORT || 3001)
const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-this'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, 'frontend', 'dist')
const uploadsPath = path.join(__dirname, 'uploads')

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

app.use(cors())
app.use(express.json({ limit: '20mb' }))
app.use('/uploads', express.static(uploadsPath))

const q = (text, params) => pool.query(text, params)

const mapSettings = (row = {}) => ({
  brandName: row.brand_name || '',
  logoUrl: row.logo_url || '',
  logoWidth: Number(row.logo_width || 0),
  logoHeight: Number(row.logo_height || 34),
  tagline: row.tagline || '',
  contactEmail: row.contact_email || '',
  phone: row.phone || '',
  address: row.address || '',
  socialInstagram: row.social_instagram || '',
  socialLinkedin: row.social_linkedin || '',
  socialGithub: row.social_github || '',
  mailHost: row.mail_host || '',
  mailPort: row.mail_port || '587',
  mailUser: row.mail_user || '',
  mailPassword: row.mail_password || '',
  mailFrom: row.mail_from || '',
  themeBg: row.theme_bg || '#111827',
  themeSurface: row.theme_surface || '#1b2235',
  themeText: row.theme_text || '#e8eaf2',
  themeMuted: row.theme_muted || '#9aa3bb',
  themeAccent: row.theme_accent || '#7c5cff',
  themeAccent2: row.theme_accent_2 || '#22d3ee',
  footerText: row.footer_text || '',
  quoteConfig: row.quote_config || null,
  chatEnabled: Boolean(row.chat_enabled),
  chatWelcome: row.chat_welcome || 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.',
})

const mapPage = (r) => ({
  id: r.id, title: r.title, slug: r.slug, excerpt: r.excerpt,
  body: r.body, heroImage: r.hero_image, published: r.published,
  showInNav: r.show_in_nav, sortOrder: r.sort_order,
  seoTitle: r.seo_title || '',
  seoDescription: r.seo_description || '',
  ogImage: r.og_image || '',
  noIndex: Boolean(r.no_index),
  sections: Array.isArray(r.sections) ? r.sections : [],
  updatedAt: r.updated_at,
})

const mapMedia = (r) => ({
  id: r.id,
  filename: r.filename,
  url: r.url,
  mime: r.mime || '',
  sizeBytes: Number(r.size_bytes || 0),
  createdAt: r.created_at,
})

const mapSlide = (r) => ({
  id: r.id, title: r.title, subtitle: r.subtitle, imageUrl: r.image_url,
  ctaLabel: r.cta_label, ctaUrl: r.cta_url, terminalText: r.terminal_text || '',
  enabled: r.enabled, sortOrder: r.sort_order,
})

const mapPackage = (r) => ({
  id: r.id, name: r.name, price: Number(r.price), period: r.period,
  description: r.description, features: r.features, ctaLabel: r.cta_label, ctaUrl: r.cta_url,
  highlighted: r.highlighted, enabled: r.enabled, sortOrder: r.sort_order,
})

const BLOCK_TYPES = ['text', 'feature', 'cta', 'benefits', 'process', 'projects', 'image-text', 'quote', 'bottom-cta', 'stats', 'logos', 'faq', 'offerte', 'packages']
const BLOCK_WIDTHS = ['full', 'twoThird', 'half', 'third']
const BLOCK_VARIANTS = ['default', 'highlight', 'quiet', 'image-left', 'image-right']

const mapBlock = (r) => ({
  id: r.id, type: r.type, title: r.title, subtitle: r.subtitle, body: r.body,
  imageUrl: r.image_url, ctaLabel: r.cta_label, ctaUrl: r.cta_url,
  enabled: r.enabled, sortOrder: r.sort_order,
  width: r.width || 'full',
  variant: r.variant || 'default',
  items: Array.isArray(r.items) ? r.items : (r.items ? r.items : []),
})

const mapCustomer = (r, services = []) => ({
  id: r.id, company: r.company, contactName: r.contact_name, email: r.email,
  phone: r.phone, address: r.address, kvk: r.kvk, btw: r.btw, website: r.website,
  status: r.status, monthlyTotal: Number(r.monthly_total || 0),
  nextInvoice: r.next_invoice, notes: r.notes, services,
})

const mapMessage = (r) => ({
  id: r.id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  company: r.company,
  subject: r.subject,
  message: r.message,
  status: r.status,
  createdAt: r.created_at,
})

const mapMailTemplate = (r) => ({
  id: r.id,
  key: r.key,
  name: r.name,
  subject: r.subject,
  body: r.body,
  variables: Array.isArray(r.variables) ? r.variables : [],
  enabled: r.enabled,
  updatedAt: r.updated_at,
})

const mapChatSession = (r) => ({
  id: r.id,
  visitorId: r.visitor_id,
  visitorName: r.visitor_name || '',
  visitorEmail: r.visitor_email || '',
  status: r.status || 'open',
  lastMessageAt: r.last_message_at,
  adminUnread: Number(r.admin_unread || 0),
  visitorUnread: Number(r.visitor_unread || 0),
  createdAt: r.created_at,
  lastMessage: r.last_message || '',
})

const mapChatMessage = (r) => ({
  id: r.id,
  sessionId: r.session_id,
  role: r.role,
  body: r.body,
  createdAt: r.created_at,
})

const defaultTemplateVariables = [
  'naam',
  'email',
  'bedrijf',
  'contactpersoon',
  'website',
  'login_url',
  'reset_url',
  'project',
  'bericht',
  'datum',
]

function renderTemplate(value = '', variables = {}) {
  return String(value || '').replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key) => {
    const replacement = variables[key]
    return replacement === undefined || replacement === null ? '' : String(replacement)
  })
}

async function createTransporterFromSettings() {
  const s = await q('select * from site_settings where id=1')
  const settings = mapSettings(s.rows[0])
  if (!settings.mailHost || !settings.mailUser || !settings.mailPassword) return null
  return {
    settings,
    transporter: nodemailer.createTransport({
      host: settings.mailHost,
      port: Number(settings.mailPort || 587),
      secure: Number(settings.mailPort || 587) === 465,
      auth: { user: settings.mailUser, pass: settings.mailPassword },
    }),
  }
}

async function sendContactMail(message) {
  const mail = await createTransporterFromSettings()
  if (!mail) return false
  const { settings, transporter } = mail

  const to = settings.contactEmail || settings.mailFrom || settings.mailUser
  await transporter.sendMail({
    from: settings.mailFrom || settings.mailUser,
    to,
    replyTo: message.email,
    subject: `Nieuw contactbericht: ${message.subject}`,
    text: [
      `Naam: ${message.name}`,
      `E-mail: ${message.email}`,
      `Telefoon: ${message.phone || '-'}`,
      `Bedrijf: ${message.company || '-'}`,
      `Onderwerp: ${message.subject}`,
      '',
      message.message,
    ].join('\n'),
  })
  return true
}

async function getPublic() {
  const [s, slides, packages, blocks, pages] = await Promise.all([
    q('select * from site_settings where id=1'),
    q('select * from hero_slides where enabled=true order by sort_order, id'),
    q('select * from packages where enabled=true order by sort_order, id'),
    q('select * from homepage_blocks where enabled=true order by sort_order, id'),
    q('select * from pages where published=true order by sort_order, id'),
  ])
  return {
    settings: mapSettings(s.rows[0]),
    heroSlides: slides.rows.map(mapSlide),
    packages: packages.rows.map(mapPackage),
    blocks: blocks.rows.map(mapBlock),
    pages: pages.rows.map(mapPage),
  }
}

async function getAdminAll() {
  const [s, slides, packages, blocks, pages, customers, services, messages, templates] = await Promise.all([
    q('select * from site_settings where id=1'),
    q('select * from hero_slides order by sort_order, id'),
    q('select * from packages order by sort_order, id'),
    q('select * from homepage_blocks order by sort_order, id'),
    q('select * from pages order by sort_order, id'),
    q('select * from customers order by id'),
    q('select * from services order by customer_id, sort_order, id'),
    q('select * from contact_messages order by created_at desc, id desc'),
    q('select * from mail_templates order by name, id'),
  ])
  return {
    settings: mapSettings(s.rows[0]),
    heroSlides: slides.rows.map(mapSlide),
    packages: packages.rows.map(mapPackage),
    blocks: blocks.rows.map(mapBlock),
    pages: pages.rows.map(mapPage),
    customers: customers.rows.map((c) => mapCustomer(c, services.rows
      .filter((sv) => sv.customer_id === c.id)
      .map((sv) => ({ id: sv.id, name: sv.name, status: sv.status, price: Number(sv.price), period: sv.period, sortOrder: sv.sort_order })))),
    messages: messages.rows.map(mapMessage),
    mailTemplates: templates.rows.map(mapMailTemplate),
  }
}

async function isChatEnabled() {
  const r = await q('select chat_enabled from site_settings where id=1')
  return Boolean(r.rows[0]?.chat_enabled)
}

async function getOrCreateChatSession(visitorId, data = {}) {
  const id = String(visitorId || '').trim().slice(0, 120)
  if (!id) throw new Error('visitorId ontbreekt.')
  const visitorName = String(data.visitorName || data.name || '').trim().slice(0, 120)
  const visitorEmail = String(data.visitorEmail || data.email || '').trim().slice(0, 180)
  const existing = await q('select * from chat_sessions where visitor_id=$1 order by id desc limit 1', [id])
  if (existing.rows[0]) {
    if (visitorName || visitorEmail) {
      const updated = await q(
        `update chat_sessions set
          visitor_name=coalesce(nullif($1,''), visitor_name),
          visitor_email=coalesce(nullif($2,''), visitor_email)
         where id=$3 returning *`,
        [visitorName, visitorEmail, existing.rows[0].id],
      )
      return mapChatSession(updated.rows[0])
    }
    return mapChatSession(existing.rows[0])
  }
  const created = await q(
    `insert into chat_sessions (visitor_id, visitor_name, visitor_email)
     values ($1,$2,$3) returning *`,
    [id, visitorName, visitorEmail],
  )
  return mapChatSession(created.rows[0])
}

async function listChatSessions() {
  const r = await q(`
    select s.*,
      (select body from chat_messages m where m.session_id=s.id order by m.created_at desc, m.id desc limit 1) as last_message
    from chat_sessions s
    order by s.last_message_at desc, s.id desc
    limit 100
  `)
  return r.rows.map(mapChatSession)
}

async function listChatMessages(sessionId) {
  const r = await q('select * from chat_messages where session_id=$1 order by created_at, id', [sessionId])
  return r.rows.map(mapChatMessage)
}

async function createChatMessage(sessionId, role, body) {
  const clean = String(body || '').trim().slice(0, 2000)
  if (!clean) throw new Error('Bericht is leeg.')
  const session = await q('select * from chat_sessions where id=$1', [sessionId])
  if (!session.rows[0]) throw new Error('Chatsessie niet gevonden.')
  const message = await q(
    'insert into chat_messages (session_id, role, body) values ($1,$2,$3) returning *',
    [sessionId, role, clean],
  )
  await q(
    `update chat_sessions set
      status=case when status='closed' and $2='visitor' then 'open' else status end,
      last_message_at=now(),
      admin_unread=admin_unread + case when $2='visitor' then 1 else 0 end,
      visitor_unread=visitor_unread + case when $2='admin' then 1 else 0 end
     where id=$1`,
    [sessionId, role],
  )
  return mapChatMessage(message.rows[0])
}

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Niet ingelogd.' })
  try { req.user = jwt.verify(token, jwtSecret); next() }
  catch { res.status(401).json({ message: 'Sessie verlopen.' }) }
}

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Geen admin rechten.' })
  next()
}

function verifyAdminToken(token) {
  try {
    const user = jwt.verify(token, jwtSecret)
    return user?.role === 'admin' ? user : null
  } catch {
    return null
  }
}

const broadcast = (event = 'site:updated') => io.emit(event)

async function ensureRuntimeSchema() {
  await q(`alter table if exists site_settings add column if not exists logo_width integer not null default 0`)
  await q(`alter table if exists site_settings add column if not exists logo_height integer not null default 34`)
  await q(`alter table if exists site_settings add column if not exists quote_config jsonb`)
  await q(`alter table if exists site_settings add column if not exists chat_enabled boolean not null default false`)
  await q(`alter table if exists site_settings add column if not exists chat_welcome text not null default 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.'`)
  await q(`alter table if exists hero_slides add column if not exists terminal_text text not null default ''`)
  await q(`alter table if exists pages add column if not exists seo_title text not null default ''`)
  await q(`alter table if exists pages add column if not exists seo_description text not null default ''`)
  await q(`alter table if exists pages add column if not exists og_image text not null default ''`)
  await q(`alter table if exists pages add column if not exists no_index boolean not null default false`)
  await q(`alter table if exists pages add column if not exists sections jsonb not null default '[]'::jsonb`)
  await q(`alter table if exists homepage_blocks add column if not exists width text not null default 'full'`)
  await q(`alter table if exists homepage_blocks add column if not exists variant text not null default 'default'`)

  await q(`
    create table if not exists media (
      id serial primary key,
      filename text not null,
      url text not null,
      mime text not null default '',
      size_bytes integer not null default 0,
      created_at timestamptz not null default now()
    )
  `)

  await q(`
    create table if not exists contact_messages (
      id serial primary key,
      name text not null,
      email text not null,
      phone text not null default '',
      company text not null default '',
      subject text not null default 'Contact via website',
      message text not null,
      status text not null default 'nieuw',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await q(`
    create table if not exists mail_templates (
      id serial primary key,
      key text unique not null,
      name text not null,
      subject text not null default '',
      body text not null default '',
      variables jsonb not null default '[]'::jsonb,
      enabled boolean not null default true,
      updated_at timestamptz not null default now()
    )
  `)

  await q(`
    create table if not exists chat_sessions (
      id serial primary key,
      visitor_id text not null,
      visitor_name text not null default '',
      visitor_email text not null default '',
      status text not null default 'open',
      last_message_at timestamptz not null default now(),
      admin_unread integer not null default 0,
      visitor_unread integer not null default 0,
      created_at timestamptz not null default now()
    )
  `)
  await q('create index if not exists chat_sessions_visitor_idx on chat_sessions (visitor_id)')
  await q('create index if not exists chat_sessions_last_idx on chat_sessions (last_message_at desc)')
  await q(`
    create table if not exists chat_messages (
      id serial primary key,
      session_id integer not null references chat_sessions(id) on delete cascade,
      role text not null check (role in ('visitor','admin','system')),
      body text not null,
      created_at timestamptz not null default now()
    )
  `)
  await q('create index if not exists chat_messages_session_idx on chat_messages (session_id, created_at)')
  await q(`
    insert into mail_templates (key, name, subject, body, variables)
    values
      ('welcome', 'Welkomsmail', 'Welkom bij {bedrijf}', '<p>Hallo {naam},</p><p>Welkom bij {bedrijf}. Je kunt inloggen via {login_url}.</p>', '["naam","bedrijf","login_url"]'::jsonb),
      ('password_reset', 'Wachtwoord vergeten', 'Wachtwoord opnieuw instellen', '<p>Hallo {naam},</p><p>Klik op deze link om je wachtwoord opnieuw in te stellen: {reset_url}</p>', '["naam","reset_url"]'::jsonb),
      ('project_update', 'Project update', 'Update over {project}', '<p>Hallo {naam},</p><p>{bericht}</p>', '["naam","project","bericht"]'::jsonb)
    on conflict (key) do nothing
  `)
}

app.get('/api/health', async (_req, res, next) => {
  try { const r = await q('select now() as now'); res.json({ ok: true, now: r.rows[0].now }) }
  catch (e) { next(e) }
})

app.get('/api/public', async (_req, res, next) => {
  try { res.json(await getPublic()) } catch (e) { next(e) }
})

app.get('/api/page/:slug', async (req, res, next) => {
  try {
    const r = await q('select * from pages where slug=$1 and published=true', [req.params.slug])
    if (!r.rows[0]) return res.status(404).json({ message: 'Pagina niet gevonden.' })
    res.json(mapPage(r.rows[0]))
  } catch (e) { next(e) }
})

app.get('/api/admin/page-preview/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q('select * from pages where id=$1', [req.params.id])
    if (!r.rows[0]) return res.status(404).json({ message: 'Pagina niet gevonden.' })
    res.json(mapPage(r.rows[0]))
  } catch (e) { next(e) }
})

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const r = await q('select * from users where lower(email)=lower($1)', [email])
    const user = r.rows[0]
    if (!user) return res.status(401).json({ message: 'Login klopt niet.' })
    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) return res.status(401).json({ message: 'Login klopt niet.' })
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, customerId: user.customer_id },
      jwtSecret, { expiresIn: '8h' },
    )
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, customerId: user.customer_id } })
  } catch (e) { next(e) }
})

app.post('/api/contact', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim()
    const email = String(req.body.email || '').trim()
    const phone = String(req.body.phone || '').trim()
    const company = String(req.body.company || '').trim()
    const subject = String(req.body.subject || 'Contact via website').trim()
    const message = String(req.body.message || '').trim()

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Naam, e-mail en bericht zijn verplicht.' })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Vul een geldig e-mailadres in.' })
    }

    const r = await q(
      `insert into contact_messages (name, email, phone, company, subject, message, status)
       values ($1,$2,$3,$4,$5,$6,'nieuw') returning *`,
      [name, email, phone, company, subject || 'Contact via website', message],
    )
    let mailSent = false
    try { mailSent = await sendContactMail(mapMessage(r.rows[0])) }
    catch (mailError) { console.error('Contactmail niet verzonden:', mailError) }
    broadcast('messages:updated')
    res.json({ ok: true, mailSent })
  } catch (e) { next(e) }
})

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }))

app.get('/api/client/me', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
    const c = await q('select * from customers where id=$1', [req.user.customerId])
    if (!c.rows[0]) return res.status(404).json({ message: 'Klant niet gevonden.' })
    const sv = await q('select * from services where customer_id=$1 order by sort_order,id', [req.user.customerId])
    res.json({ customer: mapCustomer(c.rows[0], sv.rows.map((s) => ({
      id: s.id, name: s.name, status: s.status, price: Number(s.price), period: s.period, sortOrder: s.sort_order,
    }))) })
  } catch (e) { next(e) }
})

app.get('/api/admin/data', requireAuth, requireAdmin, async (_req, res, next) => {
  try { res.json(await getAdminAll()) } catch (e) { next(e) }
})

app.get('/api/admin/messages', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const r = await q('select * from contact_messages order by created_at desc, id desc')
    res.json({ messages: r.rows.map(mapMessage) })
  } catch (e) { next(e) }
})

app.put('/api/admin/messages/:id/read', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q(
      `update contact_messages set status='gelezen', updated_at=now() where id=$1 returning *`,
      [req.params.id],
    )
    broadcast('messages:updated')
    res.json(mapMessage(r.rows[0]))
  } catch (e) { next(e) }
})

app.delete('/api/admin/messages/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await q('delete from contact_messages where id=$1', [req.params.id])
    broadcast('messages:updated')
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.post('/api/chat/session', async (req, res, next) => {
  try {
    if (!(await isChatEnabled())) return res.status(403).json({ message: 'Chat is uitgeschakeld.' })
    const session = await getOrCreateChatSession(req.body?.visitorId, req.body || {})
    const messages = await listChatMessages(session.id)
    res.json({ session, messages })
  } catch (e) { next(e) }
})

app.get('/api/admin/chat/settings', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const r = await q('select chat_enabled, chat_welcome from site_settings where id=1')
    res.json({
      chatEnabled: Boolean(r.rows[0]?.chat_enabled),
      chatWelcome: r.rows[0]?.chat_welcome || 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.',
    })
  } catch (e) { next(e) }
})

app.put('/api/admin/chat/settings', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q(
      `update site_settings set chat_enabled=$1, chat_welcome=$2, updated_at=now()
       where id=1 returning *`,
      [Boolean(req.body?.chatEnabled), req.body?.chatWelcome || 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.'],
    )
    broadcast('site:updated')
    io.to('chat:admins').emit('chat:settings', {
      chatEnabled: Boolean(r.rows[0].chat_enabled),
      chatWelcome: r.rows[0].chat_welcome,
    })
    res.json(mapSettings(r.rows[0]))
  } catch (e) { next(e) }
})

app.get('/api/admin/chat/sessions', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    res.json({ sessions: await listChatSessions() })
  } catch (e) { next(e) }
})

app.get('/api/admin/chat/sessions/:id/messages', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await q('update chat_sessions set admin_unread=0 where id=$1', [req.params.id])
    res.json({ messages: await listChatMessages(req.params.id) })
  } catch (e) { next(e) }
})

app.put('/api/admin/chat/sessions/:id/status', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const status = req.body?.status === 'closed' ? 'closed' : 'open'
    const r = await q('update chat_sessions set status=$1 where id=$2 returning *', [status, req.params.id])
    if (!r.rows[0]) return res.status(404).json({ message: 'Chatsessie niet gevonden.' })
    const session = mapChatSession(r.rows[0])
    io.to(`chat:session:${session.id}`).emit('chat:session', session)
    io.to('chat:admins').emit('chat:sessions', await listChatSessions())
    res.json(session)
  } catch (e) { next(e) }
})

app.put('/api/admin/settings', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const s = req.body
    const r = await q(`
      update site_settings set
        brand_name=$1, logo_url=$2, logo_width=$3, logo_height=$4,
        tagline=$5, contact_email=$6, phone=$7, address=$8,
        social_instagram=$9, social_linkedin=$10, social_github=$11,
        mail_host=$12, mail_port=$13, mail_user=$14, mail_password=$15, mail_from=$16,
        theme_bg=$17, theme_surface=$18, theme_text=$19, theme_muted=$20, theme_accent=$21, theme_accent_2=$22,
        footer_text=$23, chat_enabled=$24, chat_welcome=$25, updated_at=now()
      where id=1 returning *`,
      [
        s.brandName||'', s.logoUrl||'', Number(s.logoWidth || 0), Number(s.logoHeight || 34),
        s.tagline||'', s.contactEmail||'', s.phone||'', s.address||'',
        s.socialInstagram||'', s.socialLinkedin||'', s.socialGithub||'',
        s.mailHost||'', s.mailPort||'587', s.mailUser||'', s.mailPassword||'', s.mailFrom||'',
        s.themeBg||'#111827', s.themeSurface||'#1b2235', s.themeText||'#e8eaf2', s.themeMuted||'#9aa3bb',
        s.themeAccent||'#7c5cff', s.themeAccent2||'#22d3ee', s.footerText||'',
        Boolean(s.chatEnabled), s.chatWelcome || 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.',
      ],
    )
    broadcast(); res.json(mapSettings(r.rows[0]))
  } catch (e) { next(e) }
})

app.put('/api/admin/quote-config', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q(
      `update site_settings set quote_config=$1, updated_at=now() where id=1 returning *`,
      [JSON.stringify(req.body || {})],
    )
    broadcast()
    res.json(mapSettings(r.rows[0]).quoteConfig)
  } catch (e) { next(e) }
})

app.post('/api/admin/upload', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { fileName, dataUrl } = req.body
    const m = /^data:(image\/(?:png|jpe?g|webp|gif|svg\+xml));base64,(.+)$/i.exec(dataUrl || '')
    if (!m) return res.status(400).json({ message: 'Geldige afbeelding vereist.' })
    const ext = m[1] === 'image/jpeg' ? 'jpg' : m[1] === 'image/svg+xml' ? 'svg' : m[1].replace('image/', '')
    const safe = path.basename(fileName || `bestand.${ext}`)
      .replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]+/gi, '-').toLowerCase() || 'bestand'
    const stored = `${safe}-${Date.now()}.${ext}`
    const buf = Buffer.from(m[2], 'base64')
    if (buf.length > 8 * 1024 * 1024) return res.status(400).json({ message: 'Max 8 MB.' })
    await fs.mkdir(uploadsPath, { recursive: true })
    await fs.writeFile(path.join(uploadsPath, stored), buf)
    const url = `/uploads/${stored}`
    await q('insert into media (filename, url, mime, size_bytes) values ($1,$2,$3,$4)',
      [stored, url, m[1], buf.length])
    res.json({ url, filename: stored })
  } catch (e) { next(e) }
})

app.get('/api/admin/media', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const r = await q('select * from media order by created_at desc, id desc limit 200')
    res.json({ media: r.rows.map(mapMedia) })
  } catch (e) { next(e) }
})

app.get('/api/admin/mail-templates', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const r = await q('select * from mail_templates order by name, id')
    res.json({ templates: r.rows.map(mapMailTemplate), variables: defaultTemplateVariables })
  } catch (e) { next(e) }
})

app.put('/api/admin/mail-templates/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const t = req.body || {}
    const variables = Array.isArray(t.variables)
      ? t.variables.map((v) => String(v).trim()).filter(Boolean)
      : []
    const r = await q(
      `update mail_templates set name=$1, subject=$2, body=$3, variables=$4, enabled=$5, updated_at=now()
       where id=$6 returning *`,
      [t.name || 'Mailtemplate', t.subject || '', t.body || '', JSON.stringify(variables), t.enabled !== false, req.params.id],
    )
    if (!r.rows[0]) return res.status(404).json({ message: 'Mailtemplate niet gevonden.' })
    res.json(mapMailTemplate(r.rows[0]))
  } catch (e) { next(e) }
})

app.post('/api/admin/mail-templates/:id/send', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const to = String(req.body?.to || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return res.status(400).json({ message: 'Geldig ontvanger e-mailadres vereist.' })
    }
    const template = await q('select * from mail_templates where id=$1 and enabled=true', [req.params.id])
    if (!template.rows[0]) return res.status(404).json({ message: 'Actieve mailtemplate niet gevonden.' })
    const mail = await createTransporterFromSettings()
    if (!mail) return res.status(400).json({ message: 'SMTP instellingen ontbreken.' })
    const variables = req.body?.variables && typeof req.body.variables === 'object' ? req.body.variables : {}
    const t = mapMailTemplate(template.rows[0])
    await mail.transporter.sendMail({
      from: mail.settings.mailFrom || mail.settings.mailUser,
      to,
      subject: renderTemplate(t.subject, variables),
      html: renderTemplate(t.body, variables),
    })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

const crud = (resource, table, mapper, columnsForUpdate) => {
  app.post(`/api/admin/${resource}`, requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const cols = columnsForUpdate.map((c) => c.col).join(',')
      const placeholders = columnsForUpdate.map((_, i) => `$${i + 1}`).join(',')
      const values = columnsForUpdate.map((c) => c.get(req.body))
      const r = await q(`insert into ${table} (${cols}) values (${placeholders}) returning *`, values)
      broadcast(); res.json(mapper(r.rows[0]))
    } catch (e) { next(e) }
  })
  app.put(`/api/admin/${resource}/:id`, requireAuth, requireAdmin, async (req, res, next) => {
    try {
      const sets = columnsForUpdate.map((c, i) => `${c.col}=$${i + 1}`).join(',')
      const values = columnsForUpdate.map((c) => c.get(req.body))
      values.push(req.params.id)
      const r = await q(
        `update ${table} set ${sets}, updated_at=now() where id=$${values.length} returning *`,
        values,
      )
      broadcast(); res.json(mapper(r.rows[0]))
    } catch (e) { next(e) }
  })
  app.delete(`/api/admin/${resource}/:id`, requireAuth, requireAdmin, async (req, res, next) => {
    try {
      await q(`delete from ${table} where id=$1`, [req.params.id])
      broadcast(); res.json({ ok: true })
    } catch (e) { next(e) }
  })
}

crud('pages', 'pages', mapPage, [
  { col: 'title', get: (b) => b.title || 'Nieuwe pagina' },
  { col: 'slug', get: (b) => (b.slug || `pagina-${Date.now()}`).toLowerCase().replace(/[^a-z0-9-]/g, '-') },
  { col: 'excerpt', get: (b) => b.excerpt || '' },
  { col: 'body', get: (b) => b.body || '' },
  { col: 'hero_image', get: (b) => b.heroImage || '' },
  { col: 'published', get: (b) => Boolean(b.published) },
  { col: 'show_in_nav', get: (b) => b.showInNav !== false },
  { col: 'sort_order', get: (b) => Number(b.sortOrder || 0) },
  { col: 'seo_title', get: (b) => b.seoTitle || '' },
  { col: 'seo_description', get: (b) => b.seoDescription || '' },
  { col: 'og_image', get: (b) => b.ogImage || '' },
  { col: 'no_index', get: (b) => Boolean(b.noIndex) },
  { col: 'sections', get: (b) => JSON.stringify(Array.isArray(b.sections) ? b.sections : []) },
])

crud('hero-slides', 'hero_slides', mapSlide, [
  { col: 'title', get: (b) => b.title || '' },
  { col: 'subtitle', get: (b) => b.subtitle || '' },
  { col: 'image_url', get: (b) => b.imageUrl || '' },
  { col: 'cta_label', get: (b) => b.ctaLabel || '' },
  { col: 'cta_url', get: (b) => b.ctaUrl || '' },
  { col: 'terminal_text', get: (b) => b.terminalText || '' },
  { col: 'enabled', get: (b) => b.enabled !== false },
  { col: 'sort_order', get: (b) => Number(b.sortOrder || 0) },
])

crud('packages', 'packages', mapPackage, [
  { col: 'name', get: (b) => b.name || 'Pakket' },
  { col: 'price', get: (b) => Number(b.price || 0) },
  { col: 'period', get: (b) => b.period || 'eenmalig' },
  { col: 'description', get: (b) => b.description || '' },
  { col: 'features', get: (b) => b.features || '' },
  { col: 'cta_label', get: (b) => b.ctaLabel || 'Vraag offerte aan' },
  { col: 'cta_url', get: (b) => b.ctaUrl || '/contact' },
  { col: 'highlighted', get: (b) => Boolean(b.highlighted) },
  { col: 'enabled', get: (b) => b.enabled !== false },
  { col: 'sort_order', get: (b) => Number(b.sortOrder || 0) },
])

crud('blocks', 'homepage_blocks', mapBlock, [
  { col: 'type', get: (b) => BLOCK_TYPES.includes(b.type) ? b.type : 'text' },
  { col: 'title', get: (b) => b.title || '' },
  { col: 'subtitle', get: (b) => b.subtitle || '' },
  { col: 'body', get: (b) => b.body || '' },
  { col: 'image_url', get: (b) => b.imageUrl || '' },
  { col: 'cta_label', get: (b) => b.ctaLabel || '' },
  { col: 'cta_url', get: (b) => b.ctaUrl || '' },
  { col: 'enabled', get: (b) => b.enabled !== false },
  { col: 'sort_order', get: (b) => Number(b.sortOrder || 0) },
  { col: 'width', get: (b) => BLOCK_WIDTHS.includes(b.width) ? b.width : 'full' },
  { col: 'variant', get: (b) => BLOCK_VARIANTS.includes(b.variant) ? b.variant : 'default' },
  { col: 'items', get: (b) => JSON.stringify(Array.isArray(b.items) ? b.items : []) },
])

app.post('/api/admin/customers', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const c = req.body
    const email = String(c.email || '').trim().toLowerCase()
    if (!c.company && !c.contactName) return res.status(400).json({ message: 'Bedrijf of contactpersoon is verplicht.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Geldig e-mailadres is verplicht.' })
    const company = c.company || ''
    const contactName = c.contactName || ''
    const r = await q(
      `insert into customers (company, contact_name, email, phone, address, kvk, btw, website, status, monthly_total, next_invoice, notes, name, contact)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *`,
      [company, contactName, email, c.phone||'', c.address||'', c.kvk||'', c.btw||'',
       c.website||'', c.status||'Actief', Number(c.monthlyTotal||0), c.nextInvoice || null, c.notes||'',
       company || contactName, contactName || company],
    )
    broadcast('customer:updated'); res.json(mapCustomer(r.rows[0], []))
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ message: 'Er bestaat al een klant met dit e-mailadres.' })
    next(e)
  }
})

app.put('/api/admin/customers/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const c = req.body
    const email = String(c.email || '').trim().toLowerCase()
    if (!c.company && !c.contactName) return res.status(400).json({ message: 'Bedrijf of contactpersoon is verplicht.' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Geldig e-mailadres is verplicht.' })
    const r = await q(
      `update customers set company=$1, contact_name=$2, email=$3, phone=$4, address=$5, kvk=$6, btw=$7,
       website=$8, status=$9, monthly_total=$10, next_invoice=$11, notes=$12, updated_at=now()
       where id=$13 returning *`,
      [c.company||'', c.contactName||'', email, c.phone||'', c.address||'', c.kvk||'', c.btw||'',
       c.website||'', c.status||'Actief', Number(c.monthlyTotal||0), c.nextInvoice || null, c.notes||'',
       req.params.id],
    )
    if (!r.rows[0]) return res.status(404).json({ message: 'Klant niet gevonden.' })
    const sv = await q('select * from services where customer_id=$1 order by sort_order,id', [req.params.id])
    broadcast('customer:updated')
    res.json(mapCustomer(r.rows[0], sv.rows.map((s) => ({
      id: s.id, name: s.name, status: s.status, price: Number(s.price), period: s.period, sortOrder: s.sort_order,
    }))))
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ message: 'Er bestaat al een klant met dit e-mailadres.' })
    next(e)
  }
})

app.delete('/api/admin/customers/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await q('delete from customers where id=$1', [req.params.id])
    broadcast('customer:updated'); res.json({ ok: true })
  } catch (e) { next(e) }
})

app.post('/api/admin/customers/:id/services', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const s = req.body
    const r = await q(
      `insert into services (customer_id, name, status, price, period, sort_order)
       values ($1,$2,$3,$4,$5,$6) returning *`,
      [req.params.id, s.name||'Dienst', s.status||'Actief', Number(s.price||0), s.period||'maand', Number(s.sortOrder||0)],
    )
    broadcast('customer:updated')
    res.json({ id: r.rows[0].id, name: r.rows[0].name, status: r.rows[0].status,
      price: Number(r.rows[0].price), period: r.rows[0].period, sortOrder: r.rows[0].sort_order })
  } catch (e) { next(e) }
})

app.put('/api/admin/services/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const s = req.body
    const r = await q(
      `update services set name=$1, status=$2, price=$3, period=$4, sort_order=$5 where id=$6 returning *`,
      [s.name||'', s.status||'Actief', Number(s.price||0), s.period||'maand', Number(s.sortOrder||0), req.params.id],
    )
    broadcast('customer:updated')
    res.json({ id: r.rows[0].id, name: r.rows[0].name, status: r.rows[0].status,
      price: Number(r.rows[0].price), period: r.rows[0].period, sortOrder: r.rows[0].sort_order })
  } catch (e) { next(e) }
})

app.delete('/api/admin/services/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await q('delete from services where id=$1', [req.params.id])
    broadcast('customer:updated'); res.json({ ok: true })
  } catch (e) { next(e) }
})

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API route niet gevonden.' })
})

app.use(express.static(distPath))

app.use((error, _req, res, _next) => {
  console.error(error)
  res.status(500).json({ message: 'Serverfout.', error: error.message })
})

app.use((_req, res) => res.sendFile(path.join(distPath, 'index.html')))

io.on('connection', (socket) => {
  console.log(`Socket verbonden: ${socket.id}`)
  let visitorSessionId = null

  socket.on('chat:admin:join', async ({ token } = {}, ack) => {
    try {
      if (!verifyAdminToken(token)) throw new Error('Geen admin rechten.')
      socket.join('chat:admins')
      ack?.({ ok: true, sessions: await listChatSessions() })
    } catch (e) {
      ack?.({ ok: false, message: e.message })
    }
  })

  socket.on('chat:visitor:join', async (payload = {}, ack) => {
    try {
      if (!(await isChatEnabled())) throw new Error('Chat is uitgeschakeld.')
      const session = await getOrCreateChatSession(payload.visitorId, payload)
      visitorSessionId = session.id
      socket.join(`chat:session:${session.id}`)
      ack?.({ ok: true, session, messages: await listChatMessages(session.id) })
      io.to('chat:admins').emit('chat:sessions', await listChatSessions())
    } catch (e) {
      ack?.({ ok: false, message: e.message })
    }
  })

  socket.on('chat:visitor:message', async (payload = {}, ack) => {
    try {
      if (!(await isChatEnabled())) throw new Error('Chat is uitgeschakeld.')
      const session = await getOrCreateChatSession(payload.visitorId, payload)
      visitorSessionId = session.id
      socket.join(`chat:session:${session.id}`)
      const message = await createChatMessage(session.id, 'visitor', payload.body)
      io.to(`chat:session:${session.id}`).emit('chat:message', message)
      io.to('chat:admins').emit('chat:sessions', await listChatSessions())
      ack?.({ ok: true, message })
    } catch (e) {
      ack?.({ ok: false, message: e.message })
    }
  })

  socket.on('chat:admin:open', async ({ token, sessionId } = {}, ack) => {
    try {
      if (!verifyAdminToken(token)) throw new Error('Geen admin rechten.')
      socket.join(`chat:session:${sessionId}`)
      await q('update chat_sessions set admin_unread=0 where id=$1', [sessionId])
      ack?.({ ok: true, messages: await listChatMessages(sessionId) })
      io.to('chat:admins').emit('chat:sessions', await listChatSessions())
    } catch (e) {
      ack?.({ ok: false, message: e.message })
    }
  })

  socket.on('chat:admin:message', async ({ token, sessionId, body } = {}, ack) => {
    try {
      if (!verifyAdminToken(token)) throw new Error('Geen admin rechten.')
      const message = await createChatMessage(sessionId, 'admin', body)
      io.to(`chat:session:${sessionId}`).emit('chat:message', message)
      io.to('chat:admins').emit('chat:sessions', await listChatSessions())
      ack?.({ ok: true, message })
    } catch (e) {
      ack?.({ ok: false, message: e.message })
    }
  })

  socket.on('chat:visitor:read', async ({ sessionId } = {}) => {
    if (visitorSessionId && Number(sessionId) === Number(visitorSessionId)) {
      await q('update chat_sessions set visitor_unread=0 where id=$1', [sessionId])
      io.to('chat:admins').emit('chat:sessions', await listChatSessions())
    }
  })

  socket.on('disconnect', () => console.log(`Socket verbroken: ${socket.id}`))
})

await ensureRuntimeSchema()

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server draait op poort ${port}`)
})
