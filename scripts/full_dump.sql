-- TD Development — volledige DB dump
-- Gegenereerd: 2026-05-12T11:47:52.251Z
-- Host: tdobbelaer.nl

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- DROP (FK-veilige volgorde)
DROP TABLE IF EXISTS site_settings CASCADE;
DROP TABLE IF EXISTS mail_templates CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS packages CASCADE;
DROP TABLE IF EXISTS hero_slides CASCADE;
DROP TABLE IF EXISTS homepage_blocks CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;

-- SCHEMA

-- Table: chat_messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id integer DEFAULT nextval('chat_messages_id_seq'::regclass) NOT NULL,
  session_id integer NOT NULL,
  role text NOT NULL,
  body text NOT NULL,
  attachment_url text DEFAULT ''::text NOT NULL,
  attachment_type text DEFAULT ''::text NOT NULL,
  attachment_name text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['visitor'::text, 'admin'::text, 'system'::text]))),
  CONSTRAINT chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id)
);
CREATE INDEX chat_messages_session_idx ON public.chat_messages USING btree (session_id, created_at);

-- Table: chat_sessions
CREATE TABLE IF NOT EXISTS chat_sessions (
  id integer DEFAULT nextval('chat_sessions_id_seq'::regclass) NOT NULL,
  visitor_id text NOT NULL,
  visitor_name text DEFAULT ''::text NOT NULL,
  visitor_email text DEFAULT ''::text NOT NULL,
  status text DEFAULT 'open'::text NOT NULL,
  last_message_at timestamp with time zone DEFAULT now() NOT NULL,
  admin_unread integer DEFAULT 0 NOT NULL,
  visitor_unread integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT chat_sessions_pkey PRIMARY KEY (id)
);
CREATE INDEX chat_sessions_last_idx ON public.chat_sessions USING btree (last_message_at DESC);
CREATE INDEX chat_sessions_visitor_idx ON public.chat_sessions USING btree (visitor_id);

-- Table: contact_messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id integer DEFAULT nextval('contact_messages_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT ''::text NOT NULL,
  company text DEFAULT ''::text NOT NULL,
  subject text DEFAULT 'Contact via website'::text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'nieuw'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);

-- Table: services
CREATE TABLE IF NOT EXISTS services (
  id integer DEFAULT nextval('services_id_seq'::regclass) NOT NULL,
  customer_id integer NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'Actief'::text NOT NULL,
  price numeric(10,2) DEFAULT 0 NOT NULL,
  period text DEFAULT 'maand'::text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  CONSTRAINT services_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
  id integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
  email text NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL,
  customer_id integer,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'client'::text]))),
  CONSTRAINT users_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_email_key UNIQUE (email)
);
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

-- Table: customers
CREATE TABLE IF NOT EXISTS customers (
  id integer DEFAULT nextval('customers_id_seq'::regclass) NOT NULL,
  company text NOT NULL,
  contact_name text DEFAULT ''::text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT ''::text NOT NULL,
  address text DEFAULT ''::text NOT NULL,
  kvk text DEFAULT ''::text NOT NULL,
  btw text DEFAULT ''::text NOT NULL,
  website text DEFAULT ''::text NOT NULL,
  status text DEFAULT 'Actief'::text NOT NULL,
  monthly_total numeric(10,2) DEFAULT 0 NOT NULL,
  next_invoice date,
  notes text DEFAULT ''::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_email_key UNIQUE (email)
);
CREATE UNIQUE INDEX customers_email_key ON public.customers USING btree (email);

-- Table: media
CREATE TABLE IF NOT EXISTS media (
  id integer DEFAULT nextval('media_id_seq'::regclass) NOT NULL,
  filename text NOT NULL,
  url text NOT NULL,
  mime text DEFAULT ''::text NOT NULL,
  size_bytes integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT media_pkey PRIMARY KEY (id)
);

-- Table: homepage_blocks
CREATE TABLE IF NOT EXISTS homepage_blocks (
  id integer DEFAULT nextval('homepage_blocks_id_seq'::regclass) NOT NULL,
  type text DEFAULT 'text'::text NOT NULL,
  title text DEFAULT ''::text NOT NULL,
  subtitle text DEFAULT ''::text NOT NULL,
  body text DEFAULT ''::text NOT NULL,
  image_url text DEFAULT ''::text NOT NULL,
  cta_label text DEFAULT ''::text NOT NULL,
  cta_url text DEFAULT ''::text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  width text DEFAULT 'full'::text NOT NULL,
  variant text DEFAULT 'default'::text NOT NULL,
  items jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT homepage_blocks_pkey PRIMARY KEY (id)
);

-- Table: hero_slides
CREATE TABLE IF NOT EXISTS hero_slides (
  id integer DEFAULT nextval('hero_slides_id_seq'::regclass) NOT NULL,
  title text DEFAULT ''::text NOT NULL,
  subtitle text DEFAULT ''::text NOT NULL,
  image_url text DEFAULT ''::text NOT NULL,
  cta_label text DEFAULT ''::text NOT NULL,
  cta_url text DEFAULT ''::text NOT NULL,
  terminal_text text DEFAULT ''::text NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT hero_slides_pkey PRIMARY KEY (id)
);

-- Table: packages
CREATE TABLE IF NOT EXISTS packages (
  id integer DEFAULT nextval('packages_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  price numeric(10,2) DEFAULT 0 NOT NULL,
  period text DEFAULT 'eenmalig'::text NOT NULL,
  description text DEFAULT ''::text NOT NULL,
  features text DEFAULT ''::text NOT NULL,
  cta_label text DEFAULT 'Vraag offerte aan'::text NOT NULL,
  cta_url text DEFAULT '/contact'::text NOT NULL,
  highlighted boolean DEFAULT false NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT packages_pkey PRIMARY KEY (id)
);

-- Table: pages
CREATE TABLE IF NOT EXISTS pages (
  id integer DEFAULT nextval('pages_id_seq'::regclass) NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  excerpt text DEFAULT ''::text NOT NULL,
  body text DEFAULT ''::text NOT NULL,
  hero_image text DEFAULT ''::text NOT NULL,
  published boolean DEFAULT false NOT NULL,
  show_in_nav boolean DEFAULT true NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  seo_title text DEFAULT ''::text NOT NULL,
  seo_description text DEFAULT ''::text NOT NULL,
  og_image text DEFAULT ''::text NOT NULL,
  no_index boolean DEFAULT false NOT NULL,
  sections jsonb DEFAULT '[]'::jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT pages_pkey PRIMARY KEY (id),
  CONSTRAINT pages_slug_key UNIQUE (slug)
);
CREATE UNIQUE INDEX pages_slug_key ON public.pages USING btree (slug);

-- Table: mail_templates
CREATE TABLE IF NOT EXISTS mail_templates (
  id integer DEFAULT nextval('mail_templates_id_seq'::regclass) NOT NULL,
  key text NOT NULL,
  name text NOT NULL,
  subject text DEFAULT ''::text NOT NULL,
  body text DEFAULT ''::text NOT NULL,
  variables jsonb DEFAULT '[]'::jsonb NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT mail_templates_pkey PRIMARY KEY (id),
  CONSTRAINT mail_templates_key_key UNIQUE (key)
);
CREATE UNIQUE INDEX mail_templates_key_key ON public.mail_templates USING btree (key);

-- Table: site_settings
CREATE TABLE IF NOT EXISTS site_settings (
  id integer DEFAULT 1 NOT NULL,
  brand_name text DEFAULT 'TD Development'::text NOT NULL,
  logo_url text DEFAULT ''::text NOT NULL,
  logo_width integer DEFAULT 0 NOT NULL,
  logo_height integer DEFAULT 34 NOT NULL,
  tagline text DEFAULT ''::text NOT NULL,
  contact_email text DEFAULT ''::text NOT NULL,
  phone text DEFAULT ''::text NOT NULL,
  address text DEFAULT ''::text NOT NULL,
  social_instagram text DEFAULT ''::text NOT NULL,
  social_linkedin text DEFAULT ''::text NOT NULL,
  social_github text DEFAULT ''::text NOT NULL,
  mail_host text DEFAULT ''::text NOT NULL,
  mail_port text DEFAULT '587'::text NOT NULL,
  mail_user text DEFAULT ''::text NOT NULL,
  mail_password text DEFAULT ''::text NOT NULL,
  mail_from text DEFAULT ''::text NOT NULL,
  theme_bg text DEFAULT '#111827'::text NOT NULL,
  theme_surface text DEFAULT '#1b2235'::text NOT NULL,
  theme_text text DEFAULT '#e8eaf2'::text NOT NULL,
  theme_muted text DEFAULT '#9aa3bb'::text NOT NULL,
  theme_accent text DEFAULT '#7c5cff'::text NOT NULL,
  theme_accent_2 text DEFAULT '#22d3ee'::text NOT NULL,
  footer_text text DEFAULT ''::text NOT NULL,
  quote_config jsonb,
  chat_enabled boolean DEFAULT false NOT NULL,
  chat_welcome text DEFAULT 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.'::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT single_site_settings CHECK ((id = 1)),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);

-- DATA

-- Data: chat_messages
INSERT INTO chat_messages (id, session_id, role, body, attachment_url, attachment_type, attachment_name, created_at) VALUES
(2, 1, 'visitor', 'test', '/uploads/chat/schermafbeelding-2026-05-06-154902-1778578389376.png', 'image/png', 'Schermafbeelding 2026-05-06 154902.png', '2026-05-12T09:33:12.466Z'),
(4, 1, 'admin', 'tetststs', '', '', '', '2026-05-12T09:33:54.949Z'),
(5, 1, 'visitor', 'sdfsdfsdfsdf', '', '', '', '2026-05-12T09:34:02.250Z'),
(6, 1, 'visitor', 'sadfasdasd', '', '', '', '2026-05-12T11:36:50.608Z');

-- Data: chat_sessions
INSERT INTO chat_sessions (id, visitor_id, visitor_name, visitor_email, status, last_message_at, admin_unread, visitor_unread, created_at) VALUES
(1, 'visitor-1778233007929-c1afb41d4ceee', '', '', 'open', '2026-05-12T11:36:50.610Z', 2, 0, '2026-05-12T09:32:49.548Z');

-- Data: services
INSERT INTO services (id, customer_id, name, status, price, period, sort_order) VALUES
(1, 1, 'Website onderhoud', 'Actief', '99.00', 'maand', 1),
(2, 1, 'Hosting', 'Actief', '25.00', 'maand', 2),
(3, 1, 'SEO optimalisatie', 'In uitvoering', '120.00', 'maand', 3);

-- Data: users
INSERT INTO users (id, email, password_hash, role, customer_id, created_at) VALUES
(1, 'admin@td-development.nl', '__REPLACE_ME__', 'admin', NULL, '2026-05-12T08:40:18.104Z'),
(2, 'klant@demo.nl', '__REPLACE_ME__', 'client', 1, '2026-05-12T08:40:18.278Z');

-- Data: customers
INSERT INTO customers (id, company, contact_name, email, phone, address, kvk, btw, website, status, monthly_total, next_invoice, notes, created_at, updated_at) VALUES
(1, 'Demo Klant BV', 'Mila Jansen', 'klant@demo.nl', '+31 6 11122233', '', '', '', 'demo-klant.nl', 'Actief', '149.00', NULL, '', '2026-05-12T08:40:18.108Z', '2026-05-12T08:40:18.108Z');

-- Data: homepage_blocks
INSERT INTO homepage_blocks (id, type, title, subtitle, body, image_url, cta_label, cta_url, enabled, sort_order, width, variant, items, created_at, updated_at) VALUES
(1, 'feature', 'Wat wij doen', 'Diensten', 'Webdesign, development, hosting, onderhoud en klantportalen — alles onder één dak.', '', '', '', FALSE, 40, 'full', 'default', '[]', '2026-05-12T08:40:17.886Z', '2026-05-12T09:37:37.420Z'),
(2, 'cta', 'Klaar om te starten?', '', 'Vraag een vrijblijvende offerte aan en we nemen binnen 24 uur contact op.', '', '', '', TRUE, 30, 'full', 'default', '[]', '2026-05-12T08:40:17.886Z', '2026-05-12T08:49:04.697Z'),
(3, 'packages', '', '', '', '', '', '', TRUE, 20, 'full', 'default', '[]', '2026-05-12T08:41:35.764Z', '2026-05-12T09:37:56.317Z'),
(4, 'benefits', '', '', '', '', '', '', TRUE, 10, 'full', 'default', '[{"text":"","title":"","iconKey":"fast"},{"text":"","title":"","iconKey":"live"},{"text":"","title":"","iconKey":"safe"},{"text":"","title":"","iconKey":"resp"}]', '2026-05-12T08:49:00.955Z', '2026-05-12T09:38:07.000Z');

-- Data: hero_slides
INSERT INTO hero_slides (id, title, subtitle, image_url, cta_label, cta_url, terminal_text, enabled, sort_order, updated_at) VALUES
(1, 'Strakke websites die converteren', 'Maatwerk design en development voor ambitieuze ondernemers.', '', 'Bekijk pakketten', '#packages', '', TRUE, 1, '2026-05-12T08:40:17.876Z'),
(2, 'Klantportalen op maat', 'Geef je klanten een eigen omgeving met realtime inzicht.', '', 'Meer info', '/over-ons', '', TRUE, 2, '2026-05-12T08:40:17.876Z'),
(3, 'Hosting, onderhoud, support', 'Wij houden je site snel, veilig en up-to-date.', '', 'Neem contact op', '/contact', '', TRUE, 3, '2026-05-12T08:40:17.876Z');

-- Data: packages
INSERT INTO packages (id, name, price, period, description, features, cta_label, cta_url, highlighted, enabled, sort_order, updated_at) VALUES
(1, 'Starter', '799.00', 'eenmalig', 'Een strakke onepager om snel online te zijn.', 'Responsive design
Tot 1 pagina
Contactformulier
Basis SEO', 'Kies Starter', '/contact', FALSE, TRUE, 1, '2026-05-12T08:40:17.882Z'),
(2, 'Business', '1899.00', 'eenmalig', 'Volledige website met CMS en klantportaal-basis.', 'Tot 8 pagina''s
CMS beheer
Klantportaal-basis
Uitgebreide SEO
Analytics', 'Kies Business', '/contact', TRUE, TRUE, 2, '2026-05-12T08:40:17.882Z'),
(3, 'Enterprise', '3499.00', 'eenmalig', 'Maatwerk web-app met integraties en realtime data.', 'Onbeperkte pagina''s
Maatwerk modules
API integraties
Realtime updates
Prioriteit support', 'Kies Enterprise', '/contact', FALSE, TRUE, 3, '2026-05-12T08:40:17.882Z');

-- Data: pages
INSERT INTO pages (id, title, slug, excerpt, body, hero_image, published, show_in_nav, sort_order, seo_title, seo_description, og_image, no_index, sections, created_at, updated_at) VALUES
(1, 'Home', 'home', 'Welkom bij TD Development.', '', '', TRUE, FALSE, 0, '', '', '', FALSE, '[]', '2026-05-12T08:40:17.873Z', '2026-05-12T08:40:17.873Z'),
(2, 'Over ons', 'over-ons', 'Wie wij zijn.', '<p>Wij ontwerpen en bouwen strakke websites, web-apps en klantportalen voor ondernemers.</p>', '', TRUE, TRUE, 1, '', '', '', FALSE, '[]', '2026-05-12T08:40:17.873Z', '2026-05-12T08:40:17.873Z'),
(3, 'Contact', 'contact', 'Neem contact op.', '<p>Stuur ons een mail of bel voor een vrijblijvend gesprek.</p>', '', TRUE, TRUE, 2, '', '', '', FALSE, '[]', '2026-05-12T08:40:17.873Z', '2026-05-12T08:40:17.873Z');

-- Data: mail_templates
INSERT INTO mail_templates (id, key, name, subject, body, variables, enabled, updated_at) VALUES
(1, 'welcome', 'Welkomsmail', 'Welkom bij {bedrijf}', '<p>Hallo {naam},</p><p>Welkom bij {bedrijf}. Je kunt inloggen via {login_url}.</p>', '["naam","bedrijf","login_url"]', TRUE, '2026-05-12T08:40:17.889Z'),
(2, 'password_reset', 'Wachtwoord vergeten', 'Wachtwoord opnieuw instellen', '<p>Hallo {naam},</p><p>Klik op deze link om je wachtwoord opnieuw in te stellen: {reset_url}</p>', '["naam","reset_url"]', TRUE, '2026-05-12T08:40:17.889Z'),
(3, 'project_update', 'Project update', 'Update over {project}', '<p>Hallo {naam},</p><p>{bericht}</p>', '["naam","project","bericht"]', TRUE, '2026-05-12T08:40:17.889Z');

-- Data: site_settings
INSERT INTO site_settings (id, brand_name, logo_url, logo_width, logo_height, tagline, contact_email, phone, address, social_instagram, social_linkedin, social_github, mail_host, mail_port, mail_user, mail_password, mail_from, theme_bg, theme_surface, theme_text, theme_muted, theme_accent, theme_accent_2, footer_text, quote_config, chat_enabled, chat_welcome, updated_at) VALUES
(1, 'TD Development', '', 0, 34, 'Strakke websites en klantportalen op maat.', 'info@td-development.nl', '+31 6 12345678', 'Nederland', '', '', '', '', '587', 'admin@td-development.nl', '__REPLACE_ME__', '', '#111827', '#1b2235', '#e8eaf2', '#9aa3bb', '#7c5cff', '#22d3ee', '© TD Development. Alle rechten voorbehouden.', NULL, TRUE, 'Hallo! Stel je vraag, ik reageer zo snel mogelijk.', '2026-05-12T09:32:40.618Z');

-- SEQUENCES herstellen
SELECT setval(pg_get_serial_sequence('chat_messages', 'id'), COALESCE((SELECT MAX(id) FROM chat_messages), 1));
SELECT setval(pg_get_serial_sequence('chat_sessions', 'id'), COALESCE((SELECT MAX(id) FROM chat_sessions), 1));
SELECT setval(pg_get_serial_sequence('contact_messages', 'id'), COALESCE((SELECT MAX(id) FROM contact_messages), 1));
SELECT setval(pg_get_serial_sequence('services', 'id'), COALESCE((SELECT MAX(id) FROM services), 1));
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('customers', 'id'), COALESCE((SELECT MAX(id) FROM customers), 1));
SELECT setval(pg_get_serial_sequence('media', 'id'), COALESCE((SELECT MAX(id) FROM media), 1));
SELECT setval(pg_get_serial_sequence('homepage_blocks', 'id'), COALESCE((SELECT MAX(id) FROM homepage_blocks), 1));
SELECT setval(pg_get_serial_sequence('hero_slides', 'id'), COALESCE((SELECT MAX(id) FROM hero_slides), 1));
SELECT setval(pg_get_serial_sequence('packages', 'id'), COALESCE((SELECT MAX(id) FROM packages), 1));
SELECT setval(pg_get_serial_sequence('pages', 'id'), COALESCE((SELECT MAX(id) FROM pages), 1));
SELECT setval(pg_get_serial_sequence('mail_templates', 'id'), COALESCE((SELECT MAX(id) FROM mail_templates), 1));
SELECT setval(pg_get_serial_sequence('site_settings', 'id'), COALESCE((SELECT MAX(id) FROM site_settings), 1));
