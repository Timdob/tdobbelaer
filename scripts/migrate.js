import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config()

const { Pool } = pg
const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
})

const q = (text, params) => pool.query(text, params)

async function reset() {
  await q(`drop table if exists services cascade`)
  await q(`drop table if exists users cascade`)
  await q(`drop table if exists customers cascade`)
  await q(`drop table if exists hero_slides cascade`)
  await q(`drop table if exists packages cascade`)
  await q(`drop table if exists homepage_blocks cascade`)
  await q(`drop table if exists pages cascade`)
  await q(`drop table if exists media cascade`)
  await q(`drop table if exists contact_messages cascade`)
  await q(`drop table if exists mail_templates cascade`)
  await q(`drop table if exists chat_messages cascade`)
  await q(`drop table if exists chat_sessions cascade`)
  await q(`drop table if exists site_settings cascade`)
}

async function createSchema() {
  await q(`
    create table site_settings (
      id integer primary key default 1,
      brand_name text not null default 'TD Development',
      logo_url text not null default '',
      logo_width integer not null default 0,
      logo_height integer not null default 34,
      tagline text not null default '',
      contact_email text not null default '',
      phone text not null default '',
      address text not null default '',
      social_instagram text not null default '',
      social_linkedin text not null default '',
      social_github text not null default '',
      mail_host text not null default '',
      mail_port text not null default '587',
      mail_user text not null default '',
      mail_password text not null default '',
      mail_from text not null default '',
      mail_secure boolean not null default false,
      mail_starttls boolean not null default true,
      mail_reject_unauthorized boolean not null default true,
      theme_bg text not null default '#f3eadb',
      theme_surface text not null default '#fffaf1',
      theme_text text not null default '#132033',
      theme_muted text not null default '#526172',
      theme_accent text not null default '#0f766e',
      theme_accent_2 text not null default '#b56f16',
      footer_text text not null default '',
      quote_config jsonb,
      chat_enabled boolean not null default false,
      chat_welcome text not null default 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.',
      updated_at timestamptz not null default now(),
      constraint single_site_settings check (id = 1)
    )
  `)

  await q(`
    create table pages (
      id serial primary key,
      title text not null,
      slug text unique not null,
      excerpt text not null default '',
      body text not null default '',
      hero_image text not null default '',
      published boolean not null default false,
      show_in_nav boolean not null default true,
      sort_order integer not null default 0,
      seo_title text not null default '',
      seo_description text not null default '',
      og_image text not null default '',
      no_index boolean not null default false,
      sections jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await q(`
    create table hero_slides (
      id serial primary key,
      title text not null default '',
      subtitle text not null default '',
      image_url text not null default '',
      cta_label text not null default '',
      cta_url text not null default '',
      terminal_text text not null default '',
      enabled boolean not null default true,
      sort_order integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `)

  await q(`
    create table packages (
      id serial primary key,
      name text not null,
      price numeric(10,2) not null default 0,
      period text not null default 'eenmalig',
      description text not null default '',
      features text not null default '',
      cta_label text not null default 'Vraag offerte aan',
      cta_url text not null default '/contact',
      highlighted boolean not null default false,
      enabled boolean not null default true,
      sort_order integer not null default 0,
      updated_at timestamptz not null default now()
    )
  `)

  await q(`
    create table service_addons (
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

  await q(`
    create table homepage_blocks (
      id serial primary key,
      type text not null default 'text',
      title text not null default '',
      subtitle text not null default '',
      body text not null default '',
      image_url text not null default '',
      cta_label text not null default '',
      cta_url text not null default '',
      enabled boolean not null default true,
      sort_order integer not null default 0,
      width text not null default 'full',
      variant text not null default 'default',
      updated_at timestamptz not null default now()
    )
  `)

  await q(`
    create table customers (
      id serial primary key,
      company text not null,
      contact_name text not null default '',
      email text unique not null,
      phone text not null default '',
      address text not null default '',
      kvk text not null default '',
      btw text not null default '',
      website text not null default '',
      status text not null default 'Actief',
      monthly_total numeric(10,2) not null default 0,
      next_invoice date,
      notes text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `)

  await q(`
    create table services (
      id serial primary key,
      customer_id integer not null references customers(id) on delete cascade,
      name text not null,
      status text not null default 'Actief',
      price numeric(10,2) not null default 0,
      period text not null default 'maand',
      sort_order integer not null default 0
    )
  `)

  await q(`
    create table users (
      id serial primary key,
      email text unique not null,
      password_hash text not null,
      role text not null check (role in ('admin', 'client')),
      customer_id integer references customers(id) on delete cascade,
      created_at timestamptz not null default now()
    )
  `)

  await q(`
    create table media (
      id serial primary key,
      filename text not null,
      url text not null,
      mime text not null default '',
      size_bytes integer not null default 0,
      created_at timestamptz not null default now()
    )
  `)

  await q(`
    create table contact_messages (
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
    create table mail_templates (
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
    create table mail_logs (
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

  await q(`
    create table chat_sessions (
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
  await q('create index chat_sessions_visitor_idx on chat_sessions (visitor_id)')
  await q('create index chat_sessions_last_idx on chat_sessions (last_message_at desc)')

  await q(`
    create table chat_messages (
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
  await q('create index chat_messages_session_idx on chat_messages (session_id, created_at)')
}

async function seed() {
  await q(
    `insert into site_settings (id, brand_name, tagline, contact_email, phone, address, footer_text)
     values (1, $1, $2, $3, $4, $5, $6)`,
    [
      'TD Development',
      'Strakke websites en klantportalen op maat.',
      'info@td-development.nl',
      '+31 6 12345678',
      'Nederland',
      '© TD Development. Alle rechten voorbehouden.',
    ],
  )

  await q(
    `insert into pages (title, slug, excerpt, body, published, show_in_nav, sort_order)
     values
       ($1,$2,$3,$4,true,false,0),
       ($5,$6,$7,$8,true,true,1),
       ($9,$10,$11,$12,true,true,2)`,
    [
      'Home', 'home', 'Welkom bij TD Development.', '',
      'Over ons', 'over-ons', 'Wie wij zijn.',
      '<p>Wij ontwerpen en bouwen strakke websites, web-apps en klantportalen voor ondernemers.</p>',
      'Contact', 'contact', 'Neem contact op.',
      '<p>Stuur ons een mail of bel voor een vrijblijvend gesprek.</p>',
    ],
  )

  await q(
    `insert into hero_slides (title, subtitle, image_url, cta_label, cta_url, sort_order) values
      ($1,$2,$3,$4,$5,1),
      ($6,$7,$8,$9,$10,2),
      ($11,$12,$13,$14,$15,3)`,
    [
      'Strakke websites die converteren', 'Maatwerk design en development voor ambitieuze ondernemers.', '', 'Bekijk pakketten', '#packages',
      'Klantportalen op maat', 'Geef je klanten een eigen omgeving met realtime inzicht.', '', 'Meer info', '/over-ons',
      'Hosting, onderhoud, support', 'Wij houden je site snel, veilig en up-to-date.', '', 'Neem contact op', '/contact',
    ],
  )

  await q(
    `insert into packages (name, price, period, description, features, cta_label, highlighted, sort_order) values
      ($1,$2,$3,$4,$5,$6,$7,1),
      ($8,$9,$10,$11,$12,$13,$14,2),
      ($15,$16,$17,$18,$19,$20,$21,3)`,
    [
      'Starter', 799, 'eenmalig',
      'Een strakke onepager om snel online te zijn.',
      'Responsive design\nTot 1 pagina\nContactformulier\nBasis SEO',
      'Kies Starter', false,

      'Business', 1899, 'eenmalig',
      'Volledige website met CMS en klantportaal-basis.',
      'Tot 8 pagina\'s\nCMS beheer\nKlantportaal-basis\nUitgebreide SEO\nAnalytics',
      'Kies Business', true,

      'Enterprise', 3499, 'eenmalig',
      'Maatwerk web-app met integraties en realtime data.',
      'Onbeperkte pagina\'s\nMaatwerk modules\nAPI integraties\nRealtime updates\nPrioriteit support',
      'Kies Enterprise', false,
    ],
  )

  await q(
    `insert into service_addons (key, name, price, period, description, features, enabled, sort_order) values
      ('seo-optimalisatie','SEO optimalisatie',149,'maand','Technische SEO, contentchecks en maandelijkse optimalisaties voor je bestaande website.','["Technische scan","Zoekwoordenadvies","Meta titles/descriptions","Maandelijkse rapportage"]'::jsonb,true,1),
      ('website-onderhoud','Website onderhoud',89,'maand','Updates, kleine verbeteringen en periodieke controle van je bestaande website.','["Updates","Back-up controle","Kleine tekstwijzigingen","Veiligheidscheck"]'::jsonb,true,2),
      ('hosting-beheer','Hosting beheer',49,'maand','Beheer van hosting, domeininstellingen en technische bereikbaarheid.','["Hostingcontrole","DNS hulp","SSL controle","Support"]'::jsonb,true,3),
      ('analytics-rapportage','Analytics rapportage',59,'maand','Inzicht in bezoekers, conversies en verbeterpunten voor je website.','["Analytics inrichting","Maandrapport","Conversiepunten","Adviespunten"]'::jsonb,true,4)`,
  )

  await q(
    `insert into homepage_blocks (type, title, subtitle, body, sort_order) values
      ('feature','Wat wij doen','Diensten','Webdesign, development, hosting, onderhoud en klantportalen — alles onder één dak.',1),
      ('cta','Klaar om te starten?','','Vraag een vrijblijvende offerte aan en we nemen binnen 24 uur contact op.',2)`,
  )

  await q(
    `insert into mail_templates (key, name, subject, body, variables) values
      ('welcome', 'Welkomsmail', 'Welkom bij {bedrijf}', '<p>Hallo {naam},</p><p>Welkom bij {bedrijf}. Je kunt inloggen via {login_url}.</p>', '["naam","bedrijf","login_url"]'::jsonb),
      ('password_reset', 'Wachtwoord vergeten', 'Wachtwoord opnieuw instellen', '<p>Hallo {naam},</p><p>Klik op deze link om je wachtwoord opnieuw in te stellen: {reset_url}</p>', '["naam","reset_url"]'::jsonb),
      ('project_update', 'Project update', 'Update over {project}', '<p>Hallo {naam},</p><p>{bericht}</p>', '["naam","project","bericht"]'::jsonb)`,
  )

  const adminHash = await bcrypt.hash('demo1234', 10)
  await q(
    `insert into users (email, password_hash, role) values ($1, $2, 'admin')`,
    ['admin@td-development.nl', adminHash],
  )

  const clientResult = await q(
    `insert into customers (company, contact_name, email, phone, website, status, monthly_total)
     values ('Demo Klant BV', 'Mila Jansen', 'klant@demo.nl', '+31 6 11122233', 'demo-klant.nl', 'Actief', 149)
     returning id`,
  )
  const clientHash = await bcrypt.hash('demo1234', 10)
  await q(
    `insert into users (email, password_hash, role, customer_id) values ($1, $2, 'client', $3)`,
    ['klant@demo.nl', clientHash, clientResult.rows[0].id],
  )
  await q(
    `insert into services (customer_id, name, status, price, period, sort_order) values
      ($1, 'Website onderhoud', 'Actief', 99, 'maand', 1),
      ($1, 'Hosting', 'Actief', 25, 'maand', 2),
      ($1, 'SEO optimalisatie', 'In uitvoering', 120, 'maand', 3)`,
    [clientResult.rows[0].id],
  )
}

try {
  console.log('Resetting database...')
  await reset()
  console.log('Creating schema...')
  await createSchema()
  console.log('Seeding data...')
  await seed()
  console.log('Database klaar. Login: admin@td-development.nl / demo1234')
  console.log('Klant login: klant@demo.nl / demo1234')
} catch (err) {
  console.error('Migration failed:', err)
  process.exitCode = 1
} finally {
  await pool.end()
}
