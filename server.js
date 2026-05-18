import { createServer } from 'node:http'
import { createWriteStream } from 'node:fs'
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
import PDFDocument from 'pdfkit'

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
  mailSecure: row.mail_secure === undefined ? Number(row.mail_port || 587) === 465 : Boolean(row.mail_secure),
  mailStarttls: row.mail_starttls === undefined ? Number(row.mail_port || 587) !== 465 : Boolean(row.mail_starttls),
  mailRejectUnauthorized: row.mail_reject_unauthorized === undefined ? true : Boolean(row.mail_reject_unauthorized),
  themeBg: row.theme_bg || '#f3eadb',
  themeSurface: row.theme_surface || '#fffaf1',
  themeText: row.theme_text || '#132033',
  themeMuted: row.theme_muted || '#526172',
  themeAccent: row.theme_accent || '#0f766e',
  themeAccent2: row.theme_accent_2 || '#b56f16',
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
  wishIds: Array.isArray(r.wish_ids) ? r.wish_ids : (r.wish_ids ? r.wish_ids : []),
})

const slugify = (value) => String(value || '')
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'dienst'

const mapServiceAddon = (r) => ({
  id: r.id,
  key: r.key,
  name: r.name,
  price: Number(r.price),
  period: r.period,
  description: r.description,
  features: Array.isArray(r.features) ? r.features : [],
  enabled: r.enabled,
  sortOrder: r.sort_order,
})

const SERVICE_ADDONS = [
  {
    key: 'seo-optimalisatie',
    name: 'SEO optimalisatie',
    price: 149,
    period: 'maand',
    description: 'Technische SEO, contentchecks en maandelijkse optimalisaties voor je bestaande website.',
    features: ['Technische scan', 'Zoekwoordenadvies', 'Meta titles/descriptions', 'Maandelijkse rapportage'],
  },
  {
    key: 'website-onderhoud',
    name: 'Website onderhoud',
    price: 89,
    period: 'maand',
    description: 'Updates, kleine verbeteringen en periodieke controle van je bestaande website.',
    features: ['Updates', 'Back-up controle', 'Kleine tekstwijzigingen', 'Veiligheidscheck'],
  },
  {
    key: 'hosting-beheer',
    name: 'Hosting beheer',
    price: 49,
    period: 'maand',
    description: 'Beheer van hosting, domeininstellingen en technische bereikbaarheid.',
    features: ['Hostingcontrole', 'DNS hulp', 'SSL controle', 'Support'],
  },
  {
    key: 'analytics-rapportage',
    name: 'Analytics rapportage',
    price: 59,
    period: 'maand',
    description: 'Inzicht in bezoekers, conversies en verbeterpunten voor je website.',
    features: ['Analytics inrichting', 'Maandrapport', 'Conversiepunten', 'Adviespunten'],
  },
]

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

const mapMailLog = (r) => ({
  id: r.id,
  source: r.source,
  status: r.status,
  to: r.recipient,
  from: r.sender,
  subject: r.subject,
  templateKey: r.template_key || '',
  relatedId: r.related_id || '',
  messageId: r.message_id || '',
  error: r.error || '',
  createdAt: r.created_at,
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
  attachmentUrl: r.attachment_url || '',
  attachmentType: r.attachment_type || '',
  attachmentName: r.attachment_name || '',
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

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

function brandedMailHtml(settings, content, options = {}) {
  const brand = escapeHtml(settings.brandName || 'TD Development')
  const title = escapeHtml(options.title || settings.brandName || 'Bericht')
  const bg = '#f3eadb'
  const surface = '#fffaf1'
  const field = '#f7efe2'
  const text = '#132033'
  const muted = '#526172'
  const accent = '#0f766e'
  const accent2 = '#b56f16'
  const border = 'rgba(19,32,51,.14)'
  const logo = settings.logoUrl
    ? `<img src="${escapeHtml(settings.logoUrl)}" alt="${brand}" style="max-height:42px;max-width:180px;display:block;">`
    : `<span style="font-size:28px;line-height:1;font-weight:900;color:${accent};letter-spacing:-.04em;">TD/</span>`
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${bg};font-family:Arial,Helvetica,sans-serif;color:${text};">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${bg};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:${surface};border:1px solid ${border};border-radius:8px;overflow:hidden;box-shadow:0 12px 28px rgba(19,32,51,.08);">
            <tr>
              <td style="padding:18px 24px 15px;background:${surface};border-bottom:1px solid ${border};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="vertical-align:middle;">
                      <div style="display:inline-flex;align-items:center;gap:9px;">
                        ${logo}
                        <span style="font-size:14px;font-weight:800;color:${text};vertical-align:middle;">${brand}</span>
                      </div>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="display:inline-block;width:28px;height:2px;background:${accent2};border-radius:999px;"></span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 24px 8px;background:${surface};">
                <div style="font-size:11px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;color:${accent};margin-bottom:8px;">TD Development</div>
                <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:${text};font-weight:800;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 26px;color:${text};font-size:14px;line-height:1.62;background:${surface};">
                <div style="color:${text};">${content}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:15px 24px;border-top:1px solid ${border};color:${muted};font-size:11px;line-height:1.5;background:${field};">
                <strong style="color:${accent};">${brand}</strong><br>
                ${escapeHtml(settings.contactEmail || settings.mailFrom || settings.mailUser || '')}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
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
      secure: Boolean(settings.mailSecure),
      requireTLS: Boolean(settings.mailStarttls) && !settings.mailSecure,
      ignoreTLS: !settings.mailStarttls && !settings.mailSecure,
      tls: {
        rejectUnauthorized: settings.mailRejectUnauthorized !== false,
      },
      auth: { user: settings.mailUser, pass: settings.mailPassword },
    }),
  }
}

async function logMailAttempt(data) {
  try {
    await q(
      `insert into mail_logs (source,status,recipient,sender,subject,template_key,related_id,message_id,error)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        data.source || 'unknown',
        data.status || 'error',
        data.to || '',
        data.from || '',
        data.subject || '',
        data.templateKey || '',
        data.relatedId || '',
        data.messageId || '',
        String(data.error || '').slice(0, 2000),
      ],
    )
  } catch (e) {
    console.error('Mail log niet opgeslagen:', e.message)
  }
}

async function sendContactMail(message) {
  const mail = await createTransporterFromSettings()
  if (!mail) return false
  const { settings, transporter } = mail

  const to = settings.contactEmail || settings.mailFrom || settings.mailUser
  const from = settings.mailFrom || settings.mailUser
  const subject = `Nieuw contactbericht: ${message.subject}`
  const htmlContent = `
    <p><strong>Naam:</strong> ${escapeHtml(message.name)}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(message.email)}</p>
    <p><strong>Telefoon:</strong> ${escapeHtml(message.phone || '-')}</p>
    <p><strong>Bedrijf:</strong> ${escapeHtml(message.company || '-')}</p>
    <p><strong>Onderwerp:</strong> ${escapeHtml(message.subject)}</p>
    <div style="margin-top:18px;padding-top:18px;border-top:1px solid rgba(0,0,0,.12);">${escapeHtml(message.message).replace(/\n/g, '<br>')}</div>
  `
  try {
    const info = await transporter.sendMail({
      from,
      to,
      replyTo: message.email,
      subject,
      html: brandedMailHtml(settings, htmlContent, { title: 'Nieuw contactbericht' }),
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
    await logMailAttempt({ source: 'contact', status: 'success', to, from, subject, relatedId: message.id, messageId: info.messageId })
  } catch (e) {
    await logMailAttempt({ source: 'contact', status: 'error', to, from, subject, relatedId: message.id, error: e.message })
    throw e
  }
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
  const [s, slides, packages, serviceAddons, blocks, pages, customers, services, messages, templates] = await Promise.all([
    q('select * from site_settings where id=1'),
    q('select * from hero_slides order by sort_order, id'),
    q('select * from packages order by sort_order, id'),
    q('select * from service_addons order by sort_order, id'),
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
    serviceAddons: serviceAddons.rows.map(mapServiceAddon),
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
      (select case
        when body <> '' then body
        when attachment_name <> '' then 'Bijlage: ' || attachment_name
        else 'Bijlage'
       end from chat_messages m where m.session_id=s.id order by m.created_at desc, m.id desc limit 1) as last_message
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

async function createChatMessage(sessionId, role, body, attachment = {}) {
  const clean = String(body || '').trim().slice(0, 2000)
  const attachmentUrl = String(attachment.attachmentUrl || '').trim()
  const attachmentType = String(attachment.attachmentType || '').trim().slice(0, 80)
  const attachmentName = String(attachment.attachmentName || '').trim().slice(0, 180)
  if (!clean && !attachmentUrl) throw new Error('Bericht is leeg.')
  const session = await q('select * from chat_sessions where id=$1', [sessionId])
  if (!session.rows[0]) throw new Error('Chatsessie niet gevonden.')
  const message = await q(
    `insert into chat_messages (session_id, role, body, attachment_url, attachment_type, attachment_name)
     values ($1,$2,$3,$4,$5,$6) returning *`,
    [sessionId, role, clean, attachmentUrl, attachmentType, attachmentName],
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

async function updateChatMessageBody(messageId, role, body) {
  const clean = String(body || '').trim().slice(0, 2000)
  const current = await q('select * from chat_messages where id=$1 and role=$2', [messageId, role])
  if (!current.rows[0]) throw new Error('Bericht niet gevonden.')
  if (!clean && !current.rows[0].attachment_url) throw new Error('Bericht mag niet leeg zijn.')
  const r = await q('update chat_messages set body=$1 where id=$2 returning *', [clean, messageId])
  return mapChatMessage(r.rows[0])
}

async function deleteChatMessage(messageId, role) {
  const current = await q('select * from chat_messages where id=$1 and role=$2', [messageId, role])
  if (!current.rows[0]) throw new Error('Bericht niet gevonden.')
  await removeChatAttachmentFile(current.rows[0].attachment_url)
  await q('delete from chat_messages where id=$1', [messageId])
  return mapChatMessage(current.rows[0])
}

async function ensureVisitorOwnsMessage(visitorId, messageId) {
  const r = await q(
    `select m.*
     from chat_messages m
     join chat_sessions s on s.id=m.session_id
     where m.id=$1 and m.role='visitor' and s.visitor_id=$2`,
    [messageId, visitorId],
  )
  if (!r.rows[0]) throw new Error('Bericht niet gevonden.')
  return r.rows[0]
}

async function saveChatUpload(fileName, dataUrl) {
  const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl || '')
  if (!match) throw new Error('Ongeldige upload.')

  const mime = match[1].toLowerCase()
  const allowed = new Map([
    ['image/png', 'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp'],
    ['image/gif', 'gif'],
    ['application/pdf', 'pdf'],
    ['text/plain', 'txt'],
    ['application/zip', 'zip'],
  ])
  if (!allowed.has(mime)) throw new Error('Bestandstype niet toegestaan.')

  const buf = Buffer.from(match[2], 'base64')
  if (buf.length > 8 * 1024 * 1024) throw new Error('Maximaal 8 MB per upload.')

  const ext = allowed.get(mime)
  const safeBase = path.basename(fileName || `chat-upload.${ext}`)
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9-]+/gi, '-')
    .toLowerCase() || 'chat-upload'
  const stored = `${safeBase}-${Date.now()}.${ext}`
  const dir = path.join(uploadsPath, 'chat')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(path.join(dir, stored), buf)
  return {
    attachmentUrl: `/uploads/chat/${stored}`,
    attachmentType: mime,
    attachmentName: path.basename(fileName || stored),
  }
}

async function removeChatAttachmentFile(attachmentUrl = '') {
  if (!attachmentUrl.startsWith('/uploads/chat/')) return
  const relative = attachmentUrl.replace(/^\/uploads\//, '').replace(/[\\/]+/g, path.sep)
  const target = path.resolve(uploadsPath, relative)
  const chatRoot = path.resolve(uploadsPath, 'chat')
  if (!target.startsWith(chatRoot + path.sep)) return
  try { await fs.unlink(target) } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }
}

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = (header.startsWith('Bearer ') ? header.slice(7) : null) || req.query.token || null
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
const notifyCustomer = (customerId, event = 'customer:updated') => io.to(`customer:${customerId}`).emit(event)

async function ensureRuntimeSchema() {
  await q(`alter table if exists site_settings add column if not exists logo_width integer not null default 0`)
  await q(`alter table if exists site_settings add column if not exists logo_height integer not null default 34`)
  await q(`alter table if exists site_settings add column if not exists quote_config jsonb`)
  await q(`alter table if exists site_settings add column if not exists chat_enabled boolean not null default false`)
  await q(`alter table if exists site_settings add column if not exists chat_welcome text not null default 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.'`)
  await q(`alter table if exists site_settings add column if not exists mail_secure boolean not null default false`)
  await q(`alter table if exists site_settings add column if not exists mail_starttls boolean not null default true`)
  await q(`alter table if exists site_settings add column if not exists mail_reject_unauthorized boolean not null default true`)
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
    create table if not exists mail_logs (
      id serial primary key,
      source text not null default 'unknown',
      status text not null default 'error',
      recipient text not null default '',
      sender text not null default '',
      subject text not null default '',
      template_key text not null default '',
      related_id text not null default '',
      message_id text not null default '',
      error text not null default '',
      created_at timestamptz not null default now()
    )
  `)
  await q('create index if not exists mail_logs_created_idx on mail_logs (created_at desc)')

  await q(`
    create table if not exists service_addons (
      id serial primary key,
      key text unique not null,
      name text not null,
      price numeric(10,2) not null default 0,
      period text not null default 'maand',
      description text not null default '',
      features jsonb not null default '[]'::jsonb,
      enabled boolean not null default true,
      sort_order integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `)
  const addonCount = await q('select count(*)::int as count from service_addons')
  if (!addonCount.rows[0]?.count) {
    for (let i = 0; i < SERVICE_ADDONS.length; i += 1) {
      const item = SERVICE_ADDONS[i]
      await q(
        `insert into service_addons (key, name, price, period, description, features, enabled, sort_order)
         values ($1,$2,$3,$4,$5,$6,true,$7) on conflict (key) do nothing`,
        [item.key, item.name, item.price, item.period, item.description, JSON.stringify(item.features || []), i + 1],
      )
    }
  }

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
      attachment_url text not null default '',
      attachment_type text not null default '',
      attachment_name text not null default '',
      created_at timestamptz not null default now()
    )
  `)
  await q(`alter table if exists chat_messages add column if not exists attachment_url text not null default ''`)
  await q(`alter table if exists chat_messages add column if not exists attachment_type text not null default ''`)
  await q(`alter table if exists chat_messages add column if not exists attachment_name text not null default ''`)
  await q('create index if not exists chat_messages_session_idx on chat_messages (session_id, created_at)')

  await q(`
    create table if not exists project_phases (
      id serial primary key,
      customer_id integer not null references customers(id) on delete cascade,
      name text not null,
      description text not null default '',
      status text not null default 'pending' check (status in ('pending','active','done')),
      sort_order integer not null default 0,
      completed_at timestamptz,
      created_at timestamptz not null default now()
    )
  `)
  await q('create index if not exists project_phases_customer_idx on project_phases (customer_id, sort_order)')

  await q(`
    create table if not exists invoices (
      id serial primary key,
      customer_id integer not null references customers(id) on delete cascade,
      invoice_number text not null default '',
      title text not null default '',
      status text not null default 'open' check (status in ('open','betaald','geannuleerd')),
      issue_date date not null default current_date,
      due_date date,
      subtotal numeric(10,2) not null default 0,
      tax_rate numeric(5,2) not null default 21,
      total numeric(10,2) not null default 0,
      paid_amount numeric(10,2) not null default 0,
      paid_at timestamptz,
      payment_method text not null default '',
      payment_reference text not null default '',
      sent_at timestamptz,
      reminder_sent_at timestamptz,
      notes text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)
  await q(`alter table if exists invoices drop constraint if exists invoices_status_check`)
  await q(`alter table if exists invoices add constraint invoices_status_check check (status in ('concept','verstuurd','open','deels_betaald','betaald','vervallen','geannuleerd'))`)
  await q(`alter table if exists invoices add column if not exists paid_amount numeric(10,2) not null default 0`)
  await q(`alter table if exists invoices add column if not exists paid_at timestamptz`)
  await q(`alter table if exists invoices add column if not exists payment_method text not null default ''`)
  await q(`alter table if exists invoices add column if not exists payment_reference text not null default ''`)
  await q(`alter table if exists invoices add column if not exists sent_at timestamptz`)
  await q(`alter table if exists invoices add column if not exists reminder_sent_at timestamptz`)
  await q('create index if not exists invoices_customer_idx on invoices (customer_id, created_at desc)')

  await q(`
    create table if not exists invoice_lines (
      id serial primary key,
      invoice_id integer not null references invoices(id) on delete cascade,
      description text not null default '',
      quantity numeric(10,2) not null default 1,
      unit_price numeric(10,2) not null default 0,
      amount numeric(10,2) not null default 0
    )
  `)

  await q(`
    create table if not exists client_files (
      id serial primary key,
      customer_id integer not null references customers(id) on delete cascade,
      uploaded_by text not null default 'client' check (uploaded_by in ('client','admin')),
      category text not null default 'Algemeen',
      filename text not null,
      original_name text not null default '',
      url text not null,
      mime text not null default '',
      size_bytes integer not null default 0,
      created_at timestamptz not null default now()
    )
  `)
  await q('create index if not exists client_files_customer_idx on client_files (customer_id, created_at desc)')

  await q(`alter table if exists customers add column if not exists monitor_enabled boolean not null default true`)

  await q(`
    create table if not exists monitor_checks (
      id serial primary key,
      customer_id integer not null references customers(id) on delete cascade,
      url text not null,
      status text not null default 'unknown',
      status_code integer,
      response_ms integer,
      error text,
      checked_at timestamptz not null default now()
    )
  `)
  await q(`create index if not exists monitor_checks_customer_idx on monitor_checks (customer_id, checked_at desc)`)

  await q(`
    insert into mail_templates (key, name, subject, body, variables)
    values
      ('welcome', 'Welkomsmail', 'Welkom bij {bedrijf}', '<p>Hallo {naam},</p><p>Welkom bij {bedrijf}. Je kunt inloggen via {login_url}.</p>', '["naam","bedrijf","login_url"]'::jsonb),
      ('password_reset', 'Wachtwoord vergeten', 'Wachtwoord opnieuw instellen', '<p>Hallo {naam},</p><p>Klik op deze link om je wachtwoord opnieuw in te stellen: {reset_url}</p>', '["naam","reset_url"]'::jsonb),
      ('project_update', 'Project update', 'Update over {project}', '<p>Hallo {naam},</p><p>{bericht}</p>', '["naam","project","bericht"]'::jsonb)
    on conflict (key) do nothing
  `)
}

async function checkCustomerUrl(customer) {
  let url = customer.website
  if (!url) return
  if (!url.startsWith('http')) url = 'https://' + url
  const start = Date.now()
  let status = 'up', statusCode = null, error = null, responseMs = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'TDobbelaer-Monitor/1.0' },
    })
    clearTimeout(timeout)
    responseMs = Date.now() - start
    statusCode = res.status
    if (res.status >= 500) { status = 'error'; error = `HTTP ${res.status}` }
    else if (res.status >= 400) { status = 'warning'; error = `HTTP ${res.status}` }
    else { status = 'up' }
  } catch (e) {
    responseMs = Date.now() - start
    status = 'error'
    error = e.name === 'AbortError' ? 'Timeout (15s)' : (e.cause?.message || e.message)
  }
  await q(
    `insert into monitor_checks (customer_id, url, status, status_code, response_ms, error) values ($1,$2,$3,$4,$5,$6)`,
    [customer.id, url, status, statusCode, responseMs, error]
  )
  notifyCustomer(customer.id, 'monitor:updated')
}

async function runMonitorChecks() {
  try {
    const r = await q(`select id, website from customers where monitor_enabled = true and website is not null and website != ''`)
    for (const c of r.rows) await checkCustomerUrl(c)
  } catch (e) {
    console.error('Monitor check fout:', e.message)
  }
}

setTimeout(() => {
  runMonitorChecks()
  setInterval(runMonitorChecks, 5 * 60 * 1000)
}, 15000)

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
    const prevLogin = user.last_login
    await q('update users set last_login=now() where id=$1', [user.id])
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, customerId: user.customer_id },
      jwtSecret, { expiresIn: '8h' },
    )
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, customerId: user.customer_id, lastLogin: prevLogin ?? null } })
  } catch (e) { next(e) }
})

app.post('/api/auth/forgot-password', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ message: 'E-mailadres is verplicht.' })
    const r = await q('select * from users where lower(email)=$1', [email])
    // Altijd succes teruggeven zodat we geen e-mails uitlekken
    if (!r.rows[0]) return res.json({ ok: true })
    const user = r.rows[0]
    const crypto = await import('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 1000 * 60 * 60) // 1 uur
    await q('update users set reset_token=$1, reset_expires=$2 where id=$3', [token, expires, user.id])
    const mail = await createTransporterFromSettings()
    if (!mail) return res.json({ ok: true })
    const s = await q('select * from site_settings where id=1')
    const settings = mapSettings(s.rows[0])
    const siteUrl = settings.siteUrl || 'https://tdobbelaer.nl'
    const resetUrl = `${siteUrl}/wachtwoord-resetten?token=${token}`
    const tpl = await q("select * from mail_templates where key='password_reset' and enabled=true limit 1")
    const from = mail.settings.mailFrom || mail.settings.mailUser
    const customerName = user.name || user.email
    if (tpl.rows[0]) {
      const t = mapMailTemplate(tpl.rows[0])
      const subject = renderTemplate(t.subject, { naam: customerName, reset_url: resetUrl })
      const html = brandedMailHtml(mail.settings, renderTemplate(t.body, { naam: customerName, reset_url: resetUrl }), { title: subject })
      await mail.transporter.sendMail({ from, to: user.email, subject, html })
    } else {
      const subject = 'Wachtwoord opnieuw instellen'
      const html = brandedMailHtml(mail.settings,
        `<p>Hallo ${escapeHtml(customerName)},</p><p>Klik op de onderstaande link om je wachtwoord opnieuw in te stellen. De link is 1 uur geldig.</p><p><a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2a7a5f;color:#fff;border-radius:8px;text-decoration:none;font-weight:700;">Wachtwoord instellen</a></p><p style="color:#888;font-size:13px;">Of kopieer: ${escapeHtml(resetUrl)}</p>`,
        { title: subject })
      await mail.transporter.sendMail({ from, to: user.email, subject, html })
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.post('/api/auth/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ message: 'Token en wachtwoord zijn verplicht.' })
    if (String(password).length < 8) return res.status(400).json({ message: 'Wachtwoord moet minimaal 8 tekens zijn.' })
    const r = await q('select * from users where reset_token=$1', [token])
    if (!r.rows[0]) return res.status(400).json({ message: 'Ongeldige of verlopen resetlink.' })
    const user = r.rows[0]
    if (!user.reset_expires || new Date(user.reset_expires) < new Date()) {
      return res.status(400).json({ message: 'Resetlink is verlopen. Vraag een nieuwe aan.' })
    }
    const hash = await bcrypt.hash(String(password), 12)
    await q('update users set password_hash=$1, reset_token=null, reset_expires=null where id=$2', [hash, user.id])
    res.json({ ok: true })
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

app.get('/api/client/service-addons', requireAuth, async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
  const r = await q('select * from service_addons where enabled=true order by sort_order, id')
  res.json({ services: r.rows.map(mapServiceAddon) })
})

app.post('/api/client/services', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
    const serviceKey = String(req.body?.serviceKey || '')
    if (!serviceKey) return res.status(400).json({ message: 'Kies een dienst.' })

    const addonR = await q('select * from service_addons where key=$1 and enabled=true', [serviceKey])
    const addon = addonR.rows[0] ? mapServiceAddon(addonR.rows[0]) : null
    if (!addon) return res.status(404).json({ message: 'Dienst niet gevonden.' })

    const existing = await q(
      'select id from services where customer_id=$1 and lower(name)=lower($2) limit 1',
      [req.user.customerId, addon.name],
    )
    if (existing.rows[0]) return res.status(409).json({ message: 'Deze dienst staat al in je pakket.' })

    const order = await q('select coalesce(max(sort_order), 0) + 1 as next_order from services where customer_id=$1', [req.user.customerId])
    const r = await q(
      `insert into services (customer_id, name, status, price, period, sort_order)
       values ($1,$2,'Actief',$3,$4,$5) returning *`,
      [req.user.customerId, addon.name, Number(addon.price || 0), addon.period || 'maand', Number(order.rows[0].next_order || 1)],
    )
    broadcast('customer:updated')
    res.json({
      id: r.rows[0].id,
      name: r.rows[0].name,
      status: r.rows[0].status,
      price: Number(r.rows[0].price),
      period: r.rows[0].period,
      sortOrder: r.rows[0].sort_order,
    })
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

app.post('/api/chat/upload', async (req, res, next) => {
  try {
    if (!(await isChatEnabled())) return res.status(403).json({ message: 'Chat is uitgeschakeld.' })
    res.json(await saveChatUpload(req.body?.fileName, req.body?.dataUrl))
  } catch (e) { next(e) }
})

app.post('/api/admin/chat/upload', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    res.json(await saveChatUpload(req.body?.fileName, req.body?.dataUrl))
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

app.delete('/api/admin/chat/sessions/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const files = await q('select attachment_url from chat_messages where session_id=$1 and attachment_url<>$2', [req.params.id, ''])
    for (const row of files.rows) await removeChatAttachmentFile(row.attachment_url)
    await q('delete from chat_sessions where id=$1', [req.params.id])
    io.to('chat:admins').emit('chat:sessions', await listChatSessions())
    io.to(`chat:session:${req.params.id}`).emit('chat:deleted', { sessionId: Number(req.params.id) })
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.delete('/api/admin/chat/messages/:id/attachment', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const current = await q('select * from chat_messages where id=$1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ message: 'Bericht niet gevonden.' })
    await removeChatAttachmentFile(current.rows[0].attachment_url)
    const r = await q(
      `update chat_messages
       set attachment_url='', attachment_type='', attachment_name=''
       where id=$1 returning *`,
      [req.params.id],
    )
    const message = mapChatMessage(r.rows[0])
    io.to(`chat:session:${message.sessionId}`).emit('chat:message:updated', message)
    io.to('chat:admins').emit('chat:sessions', await listChatSessions())
    res.json(message)
  } catch (e) { next(e) }
})

app.put('/api/admin/chat/messages/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const message = await updateChatMessageBody(req.params.id, 'admin', req.body?.body)
    io.to(`chat:session:${message.sessionId}`).emit('chat:message:updated', message)
    io.to('chat:admins').emit('chat:sessions', await listChatSessions())
    res.json(message)
  } catch (e) { next(e) }
})

app.delete('/api/admin/chat/messages/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const message = await deleteChatMessage(req.params.id, 'admin')
    io.to(`chat:session:${message.sessionId}`).emit('chat:message:deleted', { id: message.id, sessionId: message.sessionId })
    io.to('chat:admins').emit('chat:sessions', await listChatSessions())
    res.json({ ok: true })
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
        mail_secure=$17, mail_starttls=$18, mail_reject_unauthorized=$19,
        theme_bg=$20, theme_surface=$21, theme_text=$22, theme_muted=$23, theme_accent=$24, theme_accent_2=$25,
        footer_text=$26, chat_enabled=$27, chat_welcome=$28, updated_at=now()
      where id=1 returning *`,
      [
        s.brandName||'', s.logoUrl||'', Number(s.logoWidth || 0), Number(s.logoHeight || 34),
        s.tagline||'', s.contactEmail||'', s.phone||'', s.address||'',
        s.socialInstagram||'', s.socialLinkedin||'', s.socialGithub||'',
        s.mailHost||'', s.mailPort||'587', s.mailUser||'', s.mailPassword||'', s.mailFrom||'',
        Boolean(s.mailSecure), s.mailStarttls !== false, s.mailRejectUnauthorized !== false,
        s.themeBg||'#f3eadb', s.themeSurface||'#fffaf1', s.themeText||'#132033', s.themeMuted||'#526172',
        s.themeAccent||'#0f766e', s.themeAccent2||'#b56f16', s.footerText||'',
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
    const [r, logs] = await Promise.all([
      q('select * from mail_templates order by name, id'),
      q('select * from mail_logs order by created_at desc, id desc limit 100'),
    ])
    res.json({ templates: r.rows.map(mapMailTemplate), variables: defaultTemplateVariables, logs: logs.rows.map(mapMailLog) })
  } catch (e) { next(e) }
})

app.get('/api/admin/mail-logs', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const logs = await q('select * from mail_logs order by created_at desc, id desc limit 200')
    res.json({ logs: logs.rows.map(mapMailLog) })
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
    const from = mail.settings.mailFrom || mail.settings.mailUser
    const subject = renderTemplate(t.subject, variables)
    try {
      const info = await mail.transporter.sendMail({
        from,
        to,
        subject,
        html: brandedMailHtml(mail.settings, renderTemplate(t.body, variables), { title: subject }),
      })
      await logMailAttempt({ source: 'template-test', status: 'success', to, from, subject, templateKey: t.key, relatedId: t.id, messageId: info.messageId })
      res.json({ ok: true, messageId: info.messageId })
    } catch (e) {
      await logMailAttempt({ source: 'template-test', status: 'error', to, from, subject, templateKey: t.key, relatedId: t.id, error: e.message })
      return res.status(500).json({ message: 'Mail verzenden mislukt.', error: e.message })
    }
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
  { col: 'wish_ids', get: (b) => JSON.stringify(Array.isArray(b.wishIds) ? b.wishIds : []) },
])

crud('service-addons', 'service_addons', mapServiceAddon, [
  { col: 'key', get: (b) => slugify(b.key || b.name || 'dienst') },
  { col: 'name', get: (b) => b.name || 'Extra dienst' },
  { col: 'price', get: (b) => Number(b.price || 0) },
  { col: 'period', get: (b) => b.period || 'maand' },
  { col: 'description', get: (b) => b.description || '' },
  { col: 'features', get: (b) => JSON.stringify(Array.isArray(b.features) ? b.features : String(b.features || '').split('\n').map((f) => f.trim()).filter(Boolean)) },
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
      `insert into customers (company, contact_name, email, phone, address, kvk, btw, website, status, monthly_total, next_invoice, notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning *`,
      [company, contactName, email, c.phone||'', c.address||'', c.kvk||'', c.btw||'',
       c.website||'', c.status||'Actief', Number(c.monthlyTotal||0), c.nextInvoice || null, c.notes||''],
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

// Klant login beheer
app.get('/api/admin/customers/:id/login', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q('select id, email, created_at from users where customer_id=$1 and role=$2', [req.params.id, 'client'])
    res.json({ login: r.rows[0] || null })
  } catch (e) { next(e) }
})

app.post('/api/admin/customers/:id/login', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '').trim()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Geldig e-mailadres is verplicht.' })
    if (password.length < 8) return res.status(400).json({ message: 'Wachtwoord moet minstens 8 tekens zijn.' })
    const existing = await q('select id from users where customer_id=$1 and role=$2', [req.params.id, 'client'])
    if (existing.rows[0]) return res.status(400).json({ message: 'Deze klant heeft al een login.' })
    const hash = await bcrypt.hash(password, 10)
    const r = await q(
      'insert into users (email, password_hash, role, customer_id) values ($1,$2,$3,$4) returning id, email, created_at',
      [email, hash, 'client', req.params.id],
    )
    res.json({ login: r.rows[0] })
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ message: 'Dit e-mailadres is al in gebruik.' })
    next(e)
  }
})

app.put('/api/admin/customers/:id/login', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const password = String(req.body.password || '').trim()
    if (password.length < 8) return res.status(400).json({ message: 'Wachtwoord moet minstens 8 tekens zijn.' })
    const hash = await bcrypt.hash(password, 10)
    const r = await q(
      'update users set password_hash=$1 where customer_id=$2 and role=$3 returning id, email, created_at',
      [hash, req.params.id, 'client'],
    )
    if (!r.rows[0]) return res.status(404).json({ message: 'Geen login gevonden voor deze klant.' })
    res.json({ login: r.rows[0] })
  } catch (e) { next(e) }
})

app.delete('/api/admin/customers/:id/login', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await q('delete from users where customer_id=$1 and role=$2', [req.params.id, 'client'])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ── Project phases ──────────────────────────────────────────────────────────
const mapPhase = (r) => ({
  id: r.id, customerId: r.customer_id, name: r.name, description: r.description,
  status: r.status, sortOrder: r.sort_order,
  completedAt: r.completed_at, createdAt: r.created_at,
})

app.get('/api/admin/customers/:id/phases', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q('select * from project_phases where customer_id=$1 order by sort_order,id', [req.params.id])
    res.json({ phases: r.rows.map(mapPhase) })
  } catch (e) { next(e) }
})

app.post('/api/admin/customers/:id/phases', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const b = req.body
    const r = await q(
      `insert into project_phases (customer_id,name,description,status,sort_order) values ($1,$2,$3,$4,$5) returning *`,
      [req.params.id, b.name||'Nieuwe fase', b.description||'', b.status||'pending', Number(b.sortOrder||0)],
    )
    notifyCustomer(req.params.id)
    res.json(mapPhase(r.rows[0]))
  } catch (e) { next(e) }
})

app.put('/api/admin/phases/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const b = req.body
    const completedAt = b.status === 'done' ? (b.completedAt || new Date().toISOString()) : null
    const r = await q(
      `update project_phases set name=$1,description=$2,status=$3,sort_order=$4,completed_at=$5 where id=$6 returning *`,
      [b.name||'', b.description||'', b.status||'pending', Number(b.sortOrder||0), completedAt, req.params.id],
    )
    if (!r.rows[0]) return res.status(404).json({ message: 'Fase niet gevonden.' })
    notifyCustomer(r.rows[0].customer_id)
    res.json(mapPhase(r.rows[0]))
  } catch (e) { next(e) }
})

app.delete('/api/admin/phases/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q('delete from project_phases where id=$1 returning customer_id', [req.params.id])
    if (r.rows[0]) notifyCustomer(r.rows[0].customer_id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.get('/api/client/phases', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
    const r = await q('select * from project_phases where customer_id=$1 order by sort_order,id', [req.user.customerId])
    res.json({ phases: r.rows.map(mapPhase) })
  } catch (e) { next(e) }
})

app.get('/api/client/monitor', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
    const r = await q(
      `select * from monitor_checks where customer_id=$1 order by checked_at desc limit 20`,
      [req.user.customerId]
    )
    res.json({ checks: r.rows })
  } catch (e) { next(e) }
})

app.get('/api/admin/customers/:id/monitor', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q(
      `select * from monitor_checks where customer_id=$1 order by checked_at desc limit 20`,
      [req.params.id]
    )
    res.json({ checks: r.rows })
  } catch (e) { next(e) }
})

app.post('/api/admin/customers/:id/monitor/check', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const c = await q('select id, website from customers where id=$1', [req.params.id])
    if (!c.rows[0]?.website) return res.status(400).json({ message: 'Geen website URL ingesteld.' })
    await checkCustomerUrl(c.rows[0])
    const r = await q('select * from monitor_checks where customer_id=$1 order by checked_at desc limit 1', [req.params.id])
    res.json({ check: r.rows[0] })
  } catch (e) { next(e) }
})

// ── Invoices ─────────────────────────────────────────────────────────────────
const mapInvoice = (r, lines = []) => ({
  id: r.id, customerId: r.customer_id, invoiceNumber: r.invoice_number,
  title: r.title, status: r.status, issueDate: r.issue_date, dueDate: r.due_date,
  subtotal: Number(r.subtotal), taxRate: Number(r.tax_rate), total: Number(r.total),
  paidAmount: Number(r.paid_amount || 0), paidAt: r.paid_at,
  paymentMethod: r.payment_method || '', paymentReference: r.payment_reference || '',
  sentAt: r.sent_at, reminderSentAt: r.reminder_sent_at,
  customerName: r.customer_name || '', customerEmail: r.customer_email || '',
  notes: r.notes, createdAt: r.created_at, updatedAt: r.updated_at, lines,
})
const mapLine = (r) => ({
  id: r.id, invoiceId: r.invoice_id, description: r.description,
  quantity: Number(r.quantity), unitPrice: Number(r.unit_price), amount: Number(r.amount),
})

async function calcInvoiceTotals(lines) {
  const subtotal = lines.reduce((s, l) => s + Number(l.amount), 0)
  return subtotal
}

const invoiceSelectWithCustomer = `
  select i.*, c.company as customer_name, c.email as customer_email
  from invoices i
  join customers c on c.id=i.customer_id
`

app.get('/api/admin/invoices', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const inv = await q(`${invoiceSelectWithCustomer} order by i.issue_date desc, i.id desc`)
    const rows = inv.rows.map((r) => mapInvoice(r))
    const today = new Date().toISOString().slice(0, 10)
    const isOpen = (i) => !['betaald', 'geannuleerd'].includes(i.status)
    const open = rows.filter(isOpen)
    const overdue = open.filter((i) => i.dueDate && String(i.dueDate).slice(0, 10) < today)
    const paidThisMonth = rows.filter((i) => i.status === 'betaald' && i.paidAt && String(i.paidAt).slice(0, 7) === today.slice(0, 7))
    const currentYear = today.slice(0, 4)
    const paidThisYear = rows.filter((i) => i.status === 'betaald' && i.paidAt && String(i.paidAt).slice(0, 4) === currentYear)
    const sum = (items, get = (i) => Number(i.total || 0)) => items.reduce((total, item) => total + get(item), 0)
    res.json({
      invoices: rows,
      summary: {
        totalOutstanding: sum(open, (i) => Math.max(Number(i.total || 0) - Number(i.paidAmount || 0), 0)),
        overdueOutstanding: sum(overdue, (i) => Math.max(Number(i.total || 0) - Number(i.paidAmount || 0), 0)),
        paidThisMonth: sum(paidThisMonth, (i) => Number(i.paidAmount || i.total || 0)),
        revenueThisYear: sum(paidThisYear, (i) => Number(i.paidAmount || i.total || 0)),
        openCount: open.length,
        overdueCount: overdue.length,
        vatOutstanding: sum(open, (i) => Math.max(Number(i.total || 0) - Number(i.subtotal || 0), 0)),
      },
    })
  } catch (e) { next(e) }
})

app.get('/api/admin/customers/:id/invoices', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const inv = await q('select * from invoices where customer_id=$1 order by created_at desc', [req.params.id])
    const ids = inv.rows.map((r) => r.id)
    const lines = ids.length ? await q(`select * from invoice_lines where invoice_id=any($1) order by id`, [ids]) : { rows: [] }
    res.json({ invoices: inv.rows.map((r) => mapInvoice(r, lines.rows.filter((l) => l.invoice_id === r.id).map(mapLine))) })
  } catch (e) { next(e) }
})

app.post('/api/admin/customers/:id/invoices', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const b = req.body
    const linesData = Array.isArray(b.lines) ? b.lines : []
    const subtotal = linesData.reduce((s, l) => s + Number(l.amount || 0), 0)
    const taxRate = Number(b.taxRate ?? 21)
    const total = subtotal * (1 + taxRate / 100)
    const paidAmount = Number(b.paidAmount || 0)
    const r = await q(
      `insert into invoices (customer_id,invoice_number,title,status,issue_date,due_date,subtotal,tax_rate,total,paid_amount,paid_at,payment_method,payment_reference,sent_at,reminder_sent_at,notes)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) returning *`,
      [req.params.id, b.invoiceNumber||'', b.title||'Factuur', b.status||'open',
       b.issueDate||new Date().toISOString().slice(0,10), b.dueDate||null,
       subtotal, taxRate, total, paidAmount, b.paidAt || null, b.paymentMethod || '', b.paymentReference || '',
       b.sentAt || null, b.reminderSentAt || null, b.notes||''],
    )
    const inv = r.rows[0]
    const insertedLines = []
    for (const l of linesData) {
      const lr = await q(
        `insert into invoice_lines (invoice_id,description,quantity,unit_price,amount) values ($1,$2,$3,$4,$5) returning *`,
        [inv.id, l.description||'', Number(l.quantity||1), Number(l.unitPrice||0), Number(l.amount||0)],
      )
      insertedLines.push(mapLine(lr.rows[0]))
    }
    notifyCustomer(req.params.id)
    res.json(mapInvoice(inv, insertedLines))
  } catch (e) { next(e) }
})

app.put('/api/admin/invoices/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const b = req.body
    const currentR = await q('select * from invoices where id=$1', [req.params.id])
    if (!currentR.rows[0]) return res.status(404).json({ message: 'Factuur niet gevonden.' })
    const current = currentR.rows[0]
    const linesData = Array.isArray(b.lines) ? b.lines : []
    const subtotal = linesData.reduce((s, l) => s + Number(l.amount || 0), 0)
    const taxRate = Number(b.taxRate ?? 21)
    const total = subtotal * (1 + taxRate / 100)
    const paidAmount = b.paidAmount !== undefined ? Number(b.paidAmount || 0) : Number(current.paid_amount || 0)
    const paidAt = b.paidAt !== undefined ? (b.paidAt || null) : current.paid_at
    const paymentMethod = b.paymentMethod !== undefined ? (b.paymentMethod || '') : current.payment_method
    const paymentReference = b.paymentReference !== undefined ? (b.paymentReference || '') : current.payment_reference
    const sentAt = b.sentAt !== undefined ? (b.sentAt || null) : current.sent_at
    const reminderSentAt = b.reminderSentAt !== undefined ? (b.reminderSentAt || null) : current.reminder_sent_at
    const r = await q(
      `update invoices set invoice_number=$1,title=$2,status=$3,issue_date=$4,due_date=$5,
       subtotal=$6,tax_rate=$7,total=$8,paid_amount=$9,paid_at=$10,payment_method=$11,payment_reference=$12,
       sent_at=$13,reminder_sent_at=$14,notes=$15,updated_at=now() where id=$16 returning *`,
      [b.invoiceNumber||'', b.title||'Factuur', b.status||'open',
       b.issueDate||new Date().toISOString().slice(0,10), b.dueDate||null,
       subtotal, taxRate, total, paidAmount, paidAt, paymentMethod, paymentReference,
       sentAt, reminderSentAt, b.notes||'', req.params.id],
    )
    await q('delete from invoice_lines where invoice_id=$1', [req.params.id])
    const insertedLines = []
    for (const l of linesData) {
      const lr = await q(
        `insert into invoice_lines (invoice_id,description,quantity,unit_price,amount) values ($1,$2,$3,$4,$5) returning *`,
        [req.params.id, l.description||'', Number(l.quantity||1), Number(l.unitPrice||0), Number(l.amount||0)],
      )
      insertedLines.push(mapLine(lr.rows[0]))
    }
    notifyCustomer(r.rows[0].customer_id)
    res.json(mapInvoice(r.rows[0], insertedLines))
  } catch (e) { next(e) }
})

app.patch('/api/admin/invoices/:id/payment', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const b = req.body || {}
    const paidAmount = Number(b.paidAmount || 0)
    const status = b.status || (paidAmount > 0 ? 'betaald' : 'open')
    const r = await q(
      `update invoices set status=$1, paid_amount=$2, paid_at=$3, payment_method=$4,
       payment_reference=$5, updated_at=now() where id=$6 returning *`,
      [status, paidAmount, b.paidAt || (status === 'betaald' ? new Date().toISOString() : null),
       b.paymentMethod || '', b.paymentReference || '', req.params.id],
    )
    if (!r.rows[0]) return res.status(404).json({ message: 'Factuur niet gevonden.' })
    notifyCustomer(r.rows[0].customer_id)
    res.json(mapInvoice(r.rows[0]))
  } catch (e) { next(e) }
})

app.post('/api/admin/invoices/:id/send-mail', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const invoiceR = await q(`${invoiceSelectWithCustomer} where i.id=$1`, [req.params.id])
    const invoice = invoiceR.rows[0]
    if (!invoice) return res.status(404).json({ message: 'Factuur niet gevonden.' })
    const to = String(req.body?.to || invoice.customer_email || '').trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return res.status(400).json({ message: 'Geldig ontvanger e-mailadres vereist.' })
    const mail = await createTransporterFromSettings()
    if (!mail) return res.status(400).json({ message: 'SMTP instellingen ontbreken.' })
    const subject = String(req.body?.subject || `Factuur ${invoice.invoice_number || invoice.id}`).trim()
    const body = String(req.body?.body || '').trim()
    const contentHtml = body
      ? body.replace(/\n/g, '<br>')
      : [
          `<p>Hallo ${invoice.customer_name || ''},</p>`,
          `<p>Hierbij ontvang je een bericht over factuur <strong>${invoice.invoice_number || invoice.id}</strong>.</p>`,
          `<p>Totaal: € ${Number(invoice.total || 0).toFixed(2)}</p>`,
        ].join('')
    const html = brandedMailHtml(mail.settings, contentHtml, { title: subject })
    const from = mail.settings.mailFrom || mail.settings.mailUser
    try {
      const info = await mail.transporter.sendMail({
        from,
        to,
        subject,
        html,
      })
      await logMailAttempt({ source: 'invoice', status: 'success', to, from, subject, relatedId: invoice.id, messageId: info.messageId })
    } catch (e) {
      await logMailAttempt({ source: 'invoice', status: 'error', to, from, subject, relatedId: invoice.id, error: e.message })
      return res.status(500).json({ message: 'Mail verzenden mislukt.', error: e.message })
    }
    const markSent = req.body?.markSent !== false
    if (markSent) {
      await q(
        `update invoices set status=case when status='concept' then 'verstuurd' else status end,
         sent_at=coalesce(sent_at, now()), updated_at=now() where id=$1`,
        [req.params.id],
      )
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.delete('/api/admin/invoices/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q('delete from invoices where id=$1 returning customer_id', [req.params.id])
    if (r.rows[0]) notifyCustomer(r.rows[0].customer_id)
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.get('/api/client/invoices', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
    const inv = await q('select * from invoices where customer_id=$1 order by created_at desc', [req.user.customerId])
    const ids = inv.rows.map((r) => r.id)
    const lines = ids.length ? await q(`select * from invoice_lines where invoice_id=any($1) order by id`, [ids]) : { rows: [] }
    res.json({ invoices: inv.rows.map((r) => mapInvoice(r, lines.rows.filter((l) => l.invoice_id === r.id).map(mapLine))) })
  } catch (e) { next(e) }
})

app.get('/api/invoices/:id/pdf', requireAuth, async (req, res, next) => {
  try {
    const invR = await q('select * from invoices where id=$1', [req.params.id])
    const inv = invR.rows[0]
    if (!inv) return res.status(404).json({ message: 'Factuur niet gevonden.' })
    if (req.user.role === 'client' && inv.customer_id !== req.user.customerId) return res.status(403).json({ message: 'Geen toegang.' })
    const linesR = await q('select * from invoice_lines where invoice_id=$1 order by id', [inv.id])
    const custR = await q('select * from customers where id=$1', [inv.customer_id])
    const cust = custR.rows[0]
    const settR = await q('select * from site_settings where id=1')
    const sett = settR.rows[0]

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="factuur-${inv.invoice_number||inv.id}.pdf"`)

    const doc = new PDFDocument({ margin: 50, size: 'A4' })
    doc.pipe(res)

    const accent = '#0f766e'
    // Header
    doc.fontSize(22).fillColor(accent).text(sett?.brand_name || 'TD Development', 50, 50)
    doc.fontSize(10).fillColor('#888').text(sett?.contact_email || '', 50, 78)
    doc.fontSize(24).fillColor('#111').text('FACTUUR', 400, 50, { align: 'right' })
    doc.fontSize(11).fillColor('#444')
      .text(`Nummer: ${inv.invoice_number || '-'}`, 400, 82, { align: 'right' })
      .text(`Datum: ${new Date(inv.issue_date).toLocaleDateString('nl-NL')}`, 400, 97, { align: 'right' })
    if (inv.due_date) doc.text(`Vervaldatum: ${new Date(inv.due_date).toLocaleDateString('nl-NL')}`, 400, 112, { align: 'right' })

    // Client info
    doc.moveDown(3).fontSize(11).fillColor('#222')
    doc.text('Aan:', 50).fillColor('#444')
      .text(cust?.company || cust?.contact_name || 'Klant', 50)
      .text(cust?.email || '', 50)

    // Title
    doc.moveDown(1.5).fontSize(14).fillColor('#111').text(inv.title || 'Factuur', 50)

    // Lines table header
    doc.moveDown(0.8)
    const tableTop = doc.y
    doc.fontSize(9).fillColor('#fff')
    doc.rect(50, tableTop, 495, 20).fill(accent)
    doc.fillColor('#fff')
      .text('Omschrijving', 55, tableTop + 6)
      .text('Aantal', 310, tableTop + 6, { width: 50, align: 'right' })
      .text('Stukprijs', 365, tableTop + 6, { width: 80, align: 'right' })
      .text('Bedrag', 450, tableTop + 6, { width: 90, align: 'right' })

    // Lines
    let y = tableTop + 24
    for (const [i, line] of linesR.rows.entries()) {
      if (i % 2 === 0) doc.rect(50, y - 3, 495, 20).fill('#f7f6ff')
      doc.fontSize(10).fillColor('#222')
        .text(line.description, 55, y, { width: 250 })
        .text(Number(line.quantity).toString(), 310, y, { width: 50, align: 'right' })
        .text(`€ ${Number(line.unit_price).toFixed(2)}`, 365, y, { width: 80, align: 'right' })
        .text(`€ ${Number(line.amount).toFixed(2)}`, 450, y, { width: 90, align: 'right' })
      y += 22
    }

    // Totals
    y += 10
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#ddd').stroke()
    y += 10
    doc.fontSize(10).fillColor('#444')
      .text('Subtotaal', 365, y, { width: 80, align: 'right' })
      .text(`€ ${Number(inv.subtotal).toFixed(2)}`, 450, y, { width: 90, align: 'right' })
    y += 18
    doc.text(`BTW ${Number(inv.tax_rate).toFixed(0)}%`, 365, y, { width: 80, align: 'right' })
      .text(`€ ${(Number(inv.total) - Number(inv.subtotal)).toFixed(2)}`, 450, y, { width: 90, align: 'right' })
    y += 18
    doc.fontSize(12).fillColor(accent)
      .text('Totaal', 365, y, { width: 80, align: 'right' })
      .text(`€ ${Number(inv.total).toFixed(2)}`, 450, y, { width: 90, align: 'right' })

    if (inv.notes) {
      doc.moveDown(3).fontSize(10).fillColor('#666').text('Notities:', 50).text(inv.notes, 50)
    }

    doc.end()
  } catch (e) { next(e) }
})

// ── Client files ─────────────────────────────────────────────────────────────
const mapClientFile = (r) => ({
  id: r.id, customerId: r.customer_id, uploadedBy: r.uploaded_by,
  category: r.category, filename: r.filename, originalName: r.original_name,
  url: r.url, mime: r.mime, sizeBytes: r.size_bytes, createdAt: r.created_at,
})

app.get('/api/admin/customers/:id/files', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q('select * from client_files where customer_id=$1 order by created_at desc', [req.params.id])
    res.json({ files: r.rows.map(mapClientFile) })
  } catch (e) { next(e) }
})

app.post('/api/admin/customers/:id/files', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { fileName, dataUrl, category } = req.body
    const m = String(dataUrl||'').match(/^data:([^;]+);base64,(.+)$/)
    if (!m) return res.status(400).json({ message: 'Ongeldig bestand.' })
    const buf = Buffer.from(m[2], 'base64')
    const ext = path.extname(fileName || 'bestand')
    const stored = `cf_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
    await fs.writeFile(path.join(uploadsPath, stored), buf)
    const url = `/uploads/${stored}`
    const r = await q(
      `insert into client_files (customer_id,uploaded_by,category,filename,original_name,url,mime,size_bytes)
       values ($1,'admin',$2,$3,$4,$5,$6,$7) returning *`,
      [req.params.id, category||'Algemeen', stored, fileName||stored, url, m[1], buf.length],
    )
    res.json(mapClientFile(r.rows[0]))
  } catch (e) { next(e) }
})

app.delete('/api/admin/files/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const r = await q('select * from client_files where id=$1', [req.params.id])
    if (r.rows[0]) {
      await fs.unlink(path.join(uploadsPath, r.rows[0].filename)).catch(() => {})
      await q('delete from client_files where id=$1', [req.params.id])
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
})

app.get('/api/client/files', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
    const r = await q('select * from client_files where customer_id=$1 order by created_at desc', [req.user.customerId])
    res.json({ files: r.rows.map(mapClientFile) })
  } catch (e) { next(e) }
})

app.post('/api/client/files', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
    const { fileName, dataUrl, category } = req.body
    const m = String(dataUrl||'').match(/^data:([^;]+);base64,(.+)$/)
    if (!m) return res.status(400).json({ message: 'Ongeldig bestand.' })
    const buf = Buffer.from(m[2], 'base64')
    if (buf.length > 10 * 1024 * 1024) return res.status(400).json({ message: 'Bestand mag maximaal 10 MB zijn.' })
    const ext = path.extname(fileName || 'bestand')
    const stored = `cf_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
    await fs.writeFile(path.join(uploadsPath, stored), buf)
    const url = `/uploads/${stored}`
    const r = await q(
      `insert into client_files (customer_id,uploaded_by,category,filename,original_name,url,mime,size_bytes)
       values ($1,'client',$2,$3,$4,$5,$6,$7) returning *`,
      [req.user.customerId, category||'Algemeen', stored, fileName||stored, url, m[1], buf.length],
    )
    res.json(mapClientFile(r.rows[0]))
  } catch (e) { next(e) }
})

app.delete('/api/client/files/:id', requireAuth, async (req, res, next) => {
  try {
    if (req.user.role !== 'client') return res.status(403).json({ message: 'Geen klant.' })
    const r = await q('select * from client_files where id=$1 and customer_id=$2 and uploaded_by=$3', [req.params.id, req.user.customerId, 'client'])
    if (!r.rows[0]) return res.status(404).json({ message: 'Bestand niet gevonden.' })
    await fs.unlink(path.join(uploadsPath, r.rows[0].filename)).catch(() => {})
    await q('delete from client_files where id=$1', [req.params.id])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// Admin eigen account
app.put('/api/admin/account', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const currentPassword = String(req.body.currentPassword || '')
    const newPassword = String(req.body.newPassword || '')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Geldig e-mailadres is verplicht.' })
    const r = await q('select * from users where id=$1', [req.user.id])
    const user = r.rows[0]
    if (!user) return res.status(404).json({ message: 'Gebruiker niet gevonden.' })
    // Als een nieuw wachtwoord opgegeven: huidig wachtwoord verplicht verifiëren
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Huidig wachtwoord is verplicht om te wijzigen.' })
      const ok = await bcrypt.compare(currentPassword, user.password_hash)
      if (!ok) return res.status(400).json({ message: 'Huidig wachtwoord klopt niet.' })
      if (newPassword.length < 8) return res.status(400).json({ message: 'Nieuw wachtwoord moet minstens 8 tekens zijn.' })
      const hash = await bcrypt.hash(newPassword, 10)
      await q('update users set email=$1, password_hash=$2 where id=$3', [email, hash, req.user.id])
    } else {
      await q('update users set email=$1 where id=$2', [email, req.user.id])
    }
    res.json({ ok: true, email })
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ message: 'Dit e-mailadres is al in gebruik.' })
    next(e)
  }
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

  socket.on('customer:join', ({ token } = {}, ack) => {
    try {
      const user = jwt.verify(token, jwtSecret)
      if (!user?.customerId) throw new Error('Geen klant token.')
      socket.join(`customer:${user.customerId}`)
      ack?.({ ok: true })
    } catch (e) {
      ack?.({ ok: false, message: e.message })
    }
  })

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
      const message = await createChatMessage(session.id, 'visitor', payload.body, payload)
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

  socket.on('chat:admin:message', async ({ token, sessionId, body, attachmentUrl, attachmentType, attachmentName } = {}, ack) => {
    try {
      if (!verifyAdminToken(token)) throw new Error('Geen admin rechten.')
      const message = await createChatMessage(sessionId, 'admin', body, { attachmentUrl, attachmentType, attachmentName })
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

  socket.on('chat:visitor:edit', async ({ visitorId, messageId, body } = {}, ack) => {
    try {
      await ensureVisitorOwnsMessage(visitorId, messageId)
      const message = await updateChatMessageBody(messageId, 'visitor', body)
      io.to(`chat:session:${message.sessionId}`).emit('chat:message:updated', message)
      io.to('chat:admins').emit('chat:sessions', await listChatSessions())
      ack?.({ ok: true, message })
    } catch (e) {
      ack?.({ ok: false, message: e.message })
    }
  })

  socket.on('chat:visitor:delete', async ({ visitorId, messageId } = {}, ack) => {
    try {
      await ensureVisitorOwnsMessage(visitorId, messageId)
      const message = await deleteChatMessage(messageId, 'visitor')
      io.to(`chat:session:${message.sessionId}`).emit('chat:message:deleted', { id: message.id, sessionId: message.sessionId })
      io.to('chat:admins').emit('chat:sessions', await listChatSessions())
      ack?.({ ok: true })
    } catch (e) {
      ack?.({ ok: false, message: e.message })
    }
  })

  socket.on('disconnect', () => console.log(`Socket verbroken: ${socket.id}`))
})

await ensureRuntimeSchema()

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`Server draait op poort ${port}`)
})
