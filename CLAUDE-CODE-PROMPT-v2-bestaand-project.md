# PROMPT VOOR CLAUDE CODE — TD Development Website
# Gebruik dit in het BESTAANDE project (mei-2026 redesign) — bouw verder op wat er al is

---

## CONTEXT — DIT IS DE BESTAANDE STRUCTUUR

Het project staat in XAMPP onder `c:/xampp/htdocs/TDOBBELAER/`. De backend (Express + Socket.io + Postgres) en frontend (Vue 3 + Vite) zijn beide al gemigreerd naar de nieuwe stack. Bouw **verder op wat er al is**, maak niets opnieuw aan wat al bestaat.

```
TDOBBELAER/
├── server.js                    ← Express 5 + Socket.io 4 (poort 3001) — AL AANWEZIG
├── scripts/
│   └── migrate.js               ← drop+create+seed Postgres (⚠️ NOOIT tegen live!)
├── uploads/                     ← base64 -> bestanden, served als /uploads/*
├── .env                         ← DB_HOST/PORT/NAME/USER/PASSWORD (Postgres)
├── frontend/                    ← Vite + Vue 3 project (AL AANWEZIG)
│   ├── dist/                    ← build output
│   ├── public/
│   ├── src/
│   │   ├── main.js
│   │   ├── App.vue
│   │   ├── assets/
│   │   ├── styles/
│   │   ├── router/index.js
│   │   ├── stores/              ← auth.js, site.js, admin.js
│   │   ├── composables/         ← api.js, socket.js, autosave.js
│   │   ├── components/
│   │   │   ├── layout/          ← MeshBackground, SiteNav, SiteFooter
│   │   │   ├── public/          ← HeroSlider, PackageCard, BlockRenderer
│   │   │   └── admin/           ← ImageUpload, RichTextEditor
│   │   └── views/
│   │       ├── HomeView.vue
│   │       ├── PageView.vue        ← dynamisch op /:slug
│   │       ├── LoginView.vue
│   │       ├── ContactView.vue
│   │       ├── QuoteView.vue       ← /offerte
│   │       ├── PortalView.vue      ← /portaal (klant)
│   │       ├── SocketTestView.vue
│   │       └── admin/
│   │           ├── AdminLayout.vue
│   │           ├── AdminDashboard.vue
│   │           ├── AdminSettings.vue
│   │           ├── AdminPages.vue
│   │           ├── AdminHero.vue
│   │           ├── AdminPackages.vue
│   │           ├── AdminBlocks.vue
│   │           ├── AdminCustomers.vue
│   │           └── AdminMessages.vue
│   ├── index.html
│   ├── package.json             ← vue, vue-router, pinia, socket.io-client
│   └── vite.config.js
```

**Belangrijk:**
- Pas bestaande bestanden aan, maak geen duplicaten of paralelle structuren.
- Logo's staan in `frontend/public/` — referenceer als `/td-logo-*.png`.
- `node_modules` zijn al geïnstalleerd. Run alleen `npm install` als je een nieuwe dep toevoegt.

---

## ⚠️ HARDE REGELS — DATABASE

- DB = **Postgres** (niet SQLite, niet MySQL). Driver: `pg`.
- `.env` heeft `DB_HOST=127.0.0.1`. Lokaal kan `DB_HOST` ook naar `tdobbelaer.nl` wijzen om tegen live data te werken.
- **NOOIT `node scripts/migrate.js` draaien zolang `.env` op een live host wijst.** Migrate doet `DROP + CREATE + seed` en wist alle live data. Eerst verifiëren dat `DB_HOST` op `127.0.0.1` of een lokale Postgres staat.
- Schema lezen/uitbreiden = altijd via `scripts/migrate.js`. Niet handmatig SQL fixen op live.

---

## WAT IK WIL BOUWEN

Een complete CMS-website voor **TD Development** — mijn freelance webdevelopment bedrijf. Ik bouw websites voor lokale ondernemers (kappers, restaurants, aannemers etc.).

**Doel van de site:**
1. Bezoekers overtuigen en vertrouwen wekken (publieke pagina's met hero, pakketten, blocks).
2. Klanten een offerte/contact-aanvraag laten doen → komt binnen via `/api/contact`.
3. Klanten een eigen portaal geven (`/portaal`) waar ze hun diensten zien.
4. Mij (admin) een dashboard geven (`/admin/*`) met realtime meldingen via Socket.io.

---

## TECH STACK

- **Frontend:** Vue 3 (Composition API, `<script setup>`) + Vue Router 4 + Pinia + Vite 8.
- **Backend:** Node.js + Express 5 + Socket.io 4 (al draaiend, poort **3001**).
- **Database:** Postgres via `pg`.
- **Auth:** JWT + bcryptjs.
- **Uploads:** base64 POST naar `/api/admin/upload` → opgeslagen in `uploads/`, geserveerd als `/uploads/<file>`. Geen multer.

API draait op `http://localhost:3001`. In Vite is een proxy ingesteld voor `/api` en `/socket.io` zodat de frontend gewoon relatieve calls kan doen — dus **gebruik `/api/...` in fetch-calls, niet `import.meta.env.VITE_API_URL`**.

---

## API ENDPOINTS (al geïmplementeerd in server.js)

```
GET    /api/health
GET    /api/public                         ← settings + hero-slides + packages + blocks (publiek)
GET    /api/page/:slug                     ← losse content-pagina

POST   /api/auth/login
GET    /api/auth/me                        ← requireAuth
GET    /api/client/me                      ← klant-eigen data (requireAuth)

POST   /api/contact                        ← contact/offerte form submission

GET    /api/admin/data                     ← alles voor admin (requireAdmin)
GET    /api/admin/messages
PUT    /api/admin/messages/:id/read
DELETE /api/admin/messages/:id
PUT    /api/admin/settings
POST   /api/admin/upload                   ← base64 upload, returns { url }

# Generieke CRUD (resource = settings | hero-slides | packages | blocks | pages):
POST   /api/admin/:resource
PUT    /api/admin/:resource/:id
DELETE /api/admin/:resource/:id

# Customers + services (custom logic):
POST   /api/admin/customers
PUT    /api/admin/customers/:id
DELETE /api/admin/customers/:id
POST   /api/admin/customers/:id/services
PUT    /api/admin/services/:id
DELETE /api/admin/services/:id
```

Socket.io: clients verbinden bij login, server emit events bij CRUD-acties (bv. `nieuw-bericht`, `offerte-update`). Gebruik `composables/socket.js` om te subscriben.

---

## DESIGN SYSTEEM

Donker thema met **mesh gradient + SVG noise + subtle grid + drift-animatie** (component: `MeshBackground.vue`, ligt achter `<RouterView>`).

CSS-variabelen staan in `frontend/src/styles/` en zijn admin-instelbaar via `/admin/settings`. Default waarden:

```css
:root {
  --bg:        #0a0e1a;     /* donkere basis */
  --surface:   #11162a;     /* kaart/panel achtergrond */
  --surface-2: #161c33;
  --border:    rgba(255,255,255,0.08);
  --border-2:  rgba(255,255,255,0.16);
  --accent:    #7c5cff;     /* violet — primair */
  --accent-2:  #22d3ee;     /* cyan — secundair / hovers */
  --accent-dim: rgba(124,92,255,0.14);
  --text:      #e8eaf2;
  --muted:     rgba(232,234,242,0.55);
  --muted-2:   rgba(232,234,242,0.22);
  --danger:    #f47067;
  --warning:   #f0c060;
  --success:   #4ec994;
  --radius:    10px;
  --radius-lg: 16px;
  --shadow:    0 8px 32px rgba(0,0,0,0.45);
  --glow:      0 0 24px rgba(124,92,255,0.30);
  --glow-2:    0 0 24px rgba(34,211,238,0.25);
  --font-body:    'Inter', system-ui, sans-serif;
  --font-display: 'Space Grotesk', 'Inter', sans-serif;
}
```

Fonts via Google Fonts in `frontend/index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
```

**Designregels:**
- Body font = Inter, displays/headings = Space Grotesk.
- Primaire CTA = violet glow knop. Secundaire = ghost-knop met cyan border-on-hover.
- Kaarten: `--surface` achtergrond, `--border` lijn, hover lift 3px + `--glow`.
- Geen scherp wit (`#fff`) — gebruik `--text`.
- Mesh-achtergrond is altijd zichtbaar; content gaat erboven via een `relative` layer.

---

## ROUTER (frontend/src/router/index.js — al aanwezig)

```javascript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/',         name: 'home',     component: () => import('../views/HomeView.vue') },
  { path: '/login',    name: 'login',    component: () => import('../views/LoginView.vue') },
  { path: '/contact',  name: 'contact',  component: () => import('../views/ContactView.vue') },
  { path: '/offerte',  name: 'quote',    component: () => import('../views/QuoteView.vue') },
  { path: '/portaal',  name: 'portal',   meta: { requiresClient: true },
    component: () => import('../views/PortalView.vue') },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '',          name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
      { path: 'settings',  name: 'admin-settings',  component: () => import('../views/admin/AdminSettings.vue') },
      { path: 'pages',     name: 'admin-pages',     component: () => import('../views/admin/AdminPages.vue') },
      { path: 'hero',      name: 'admin-hero',      component: () => import('../views/admin/AdminHero.vue') },
      { path: 'packages',  name: 'admin-packages',  component: () => import('../views/admin/AdminPackages.vue') },
      { path: 'blocks',    name: 'admin-blocks',    component: () => import('../views/admin/AdminBlocks.vue') },
      { path: 'customers', name: 'admin-customers', component: () => import('../views/admin/AdminCustomers.vue') },
      { path: 'messages',  name: 'admin-messages',  component: () => import('../views/admin/AdminMessages.vue') },
    ],
  },
  { path: '/:slug', name: 'page', component: () => import('../views/PageView.vue'), props: true },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, saved) { return saved || { top: 0 } },
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAdmin  && !auth.isAdmin)  return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.requiresClient && !auth.isClient) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

export default router
```

⚠️ De `/:slug` route is een catch-all voor CMS-pagina's. **Plaats nieuwe statische routes hierboven**, anders worden ze opgevangen door PageView.

---

## STORES (Pinia, `<script setup>`-stijl)

### `stores/auth.js`
- State: `user`, `token` (uit `localStorage`).
- Computed: `isLoggedIn`, `isAdmin` (= `user.role === 'admin'`), `isClient` (= `user.role === 'customer'`).
- Actions: `login(email, password)`, `logout()`, `fetchMe()`, `authHeader()`.
- Login: POST `/api/auth/login` → bewaar token in `localStorage` + `state`.
- Bij app-boot in `main.js`: als token bestaat → `fetchMe()` om user te hydrateren; faalt = `logout()`.

### `stores/site.js`
- State: `settings`, `heroSlides`, `packages`, `blocks`, `loaded`.
- Action: `loadPublic()` → GET `/api/public`, vult alle 4 lijsten.
- Wordt aangeroepen in `App.vue` `onMounted`.

### `stores/admin.js`
- State: `data` (volledige snapshot van admin payload), `loading`, `messagesUnread`.
- Actions: `loadAll()` → GET `/api/admin/data`; `create(resource, payload)`, `update(resource, id, payload)`, `remove(resource, id)` mappen op de generieke CRUD endpoints; daarna lokaal patchen i.p.v. opnieuw alles fetchen.
- Reageert op socket-events: `nieuw-bericht`, `offerte-update` → patch state + toast.

---

## COMPOSABLES

### `composables/api.js`
Wrapper rond `fetch` die:
- `Content-Type: application/json` zet bij body,
- automatisch `Authorization: Bearer <token>` meestuurt (uit auth store),
- `res.ok` checkt en op 401 → `auth.logout()` + redirect naar `/login`,
- JSON parsed of throw met server-message.

```javascript
export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const auth = useAuthStore()
  const res = await fetch(path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...auth.authHeader(),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) { auth.logout(); throw new Error('Niet ingelogd') }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText)
  return data
}
```

### `composables/socket.js`
- Singleton `io()` client, connect na login, disconnect na logout.
- Exporteert `useSocket()` die `socket` + helper `on(event, handler)` returnt en bij unmount opruimt.

### `composables/autosave.js`
- Debounced watcher rond een ref → roept `save()` na 800 ms inactiviteit.
- Toont status: `idle | saving | saved | error`. Gebruikt in admin-forms.

---

## VITE CONFIG (al aanwezig — niet wijzigen tenzij nodig)

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 5173,
    proxy: {
      '/api':       'http://localhost:3001',
      '/uploads':   'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
})
```

---

## PUBLIEKE PAGINA'S — OPBOUW

### `App.vue`
```
<MeshBackground />
<SiteNav />            ← op /admin/* niet tonen
<RouterView />
<SiteFooter />         ← idem, niet op /admin/*
```

### `HomeView.vue` (gebruikt `site` store)
- **HeroSlider** — auto-cycle elke **5.5s**, dots als controls, pulse/orb visual rechts. Slides komen uit `site.heroSlides`.
- **Packages-sectie** — grid van `PackageCard` (één met `highlighted=true` krijgt "meest gekozen" badge).
- **Blocks-sectie** — `BlockRenderer` rendert generieke blocks op basis van `block.type`:
  - `text` → headline + body (rich text uit RichTextEditor),
  - `feature` → icoon + titel + beschrijving in 3-koloms grid,
  - `cta` → banner met titel + knop.
- **Contact-CTA** onderaan → naar `/contact` of `/offerte`.

### `PageView.vue` (`/:slug`)
- Roept `GET /api/page/:slug` aan.
- 404 als niet gevonden.
- Rendert hero-image (als gezet) + rich content (HTML uit DB) via `v-html` op een `.prose` container.

### `ContactView.vue` / `QuoteView.vue`
- Form: naam, e-mail, telefoon, bedrijf, bericht.
- POST `/api/contact` → toast + reset form.
- QuoteView is uitgebreider: ook pakket-keuze (uit `site.packages`) en gewenste deadline.

### `LoginView.vue`
- Form: e-mail + wachtwoord.
- Op succes: `auth.login()` → redirect naar `?redirect=` of `/admin` (admin) of `/portaal` (klant).

### `PortalView.vue` (`requiresClient`)
- Welkom + lijst van eigen `services` (uit `/api/client/me`).
- Per service: status badge, prijs, startdatum, link naar live website.

---

## ADMIN

### `AdminLayout.vue`
- Eigen sidebar (geen public nav/footer).
- Sidebar links: Dashboard · Settings · Pages · Hero · Packages · Blocks · Customers · Messages · Logout.
- Header: notificatie-bel met `admin.messagesUnread` badge.
- Bij mount: `admin.loadAll()` + socket subscribe op `nieuw-bericht`, `offerte-update`.

### `AdminDashboard.vue`
- KPI-tegels: Open berichten · Aantal klanten · Aantal pagina's · Pakketten.
- Laatste 10 berichten + recente activiteit.
- Realtime toast bij `nieuw-bericht`: `🚀 Nieuw bericht van {naam}`.

### `AdminSettings.vue`
- Form met alle keys uit `settings` tabel (kleuren, site-titel, contact-info, social links).
- Color pickers schrijven direct in CSS-vars — preview live.
- PUT `/api/admin/settings`.

### `AdminPages.vue`
- Lijst pagina's, "Nieuwe pagina" knop.
- Editor: titel, slug, hero image (`ImageUpload`), content (`RichTextEditor`), published toggle.
- Autosave via `useAutosave()`.

### `AdminHero.vue`
- CRUD voor hero-slides: titel, subtitel, image, CTA-tekst, CTA-link, volgorde.
- Drag-to-reorder (HTML5 DnD) — bij drop: PUT met nieuwe `order`.

### `AdminPackages.vue`
- CRUD: naam, prijs (number), prijs-suffix ("eenmalig" / "/mnd"), features (array van strings), `highlighted` (boolean).

### `AdminBlocks.vue`
- CRUD voor homepage-blocks: type (`text`/`feature`/`cta`), title, body (rich text bij text, plain bij rest), volgorde.

### `AdminCustomers.vue`
- Lijst klanten met filter op status. Per klant: company, contactName, email, phone, address, kvk, btw, website, status, monthlyTotal, nextInvoice, notes.
- Detail-paneel met sub-CRUD voor `services` (toevoegen / bewerken / verwijderen).

### `AdminMessages.vue`
- Inbox van contact/offerte-aanvragen.
- Per bericht: lees/ongelezen, reply-knop (mailto) of "markeer afgehandeld", verwijderen.
- PUT `/api/admin/messages/:id/read`, DELETE `/api/admin/messages/:id`.

---

## SHARED COMPONENTEN

### `MeshBackground.vue`
- Fixed full-viewport, `z-index: -1`.
- Layered: radial gradients (violet + cyan), SVG noise (`<feTurbulence>`), subtiele grid (CSS `linear-gradient` op 32px), 30s drift-animatie via `transform: translate3d`.

### `SiteNav.vue`
- Logo links, links rechts: Home · Pakketten · Pagina's (dynamisch uit `site.settings.menu`) · Contact.
- Auth-aware rechts:
  - Niet ingelogd: `[Inloggen]` + `[Offerte aanvragen →]`.
  - Klant: `[👤 Naam ▾]` dropdown met Portaal · Uitloggen.
  - Admin: `[🛠 Admin]` knop direct naar `/admin`.

### `SiteFooter.vue`
- 3 kolommen: bedrijf (KVK, adres), links, contact + social.
- Copyright met huidig jaar.

### `HeroSlider.vue`
- Props: `slides` (array).
- Auto-cycle 5.5s, pauzeert bij hover.
- Dots controls onderaan; click = jump-to.
- Naast tekst-content: pulserende orb visual (CSS-only `@keyframes pulse`).

### `PackageCard.vue`
- Props: `pkg` ({ name, price, priceSuffix, features[], highlighted }).
- `highlighted=true` → violet glow + "MEEST GEKOZEN" badge.
- Knop onderaan → `/offerte?pkg=<id>`.

### `BlockRenderer.vue`
- Switch op `block.type`, rendert juist sub-template.

### `ImageUpload.vue` (admin)
- Drop-zone of klik-om-te-kiezen.
- Leest file als base64 (max 8 MB), POST naar `/api/admin/upload`.
- Returnt `{ url }` → emit `update:modelValue`.

### `RichTextEditor.vue` (admin)
- `contenteditable` div + toolbar met `document.execCommand` (bold, italic, h2, h3, link, ul, ol).
- v-model via `innerHTML` (sanitize bij read uit DB).

---

## UI-PATRONEN (CSS — in `styles/`)

```css
.btn {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 0.85rem;
  padding: 0.7rem 1.4rem;
  border-radius: var(--radius);
  border: 1px solid transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s, background 0.2s, border-color 0.2s;
  text-decoration: none;
}
.btn-primary {
  background: var(--accent);
  color: #fff;
}
.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow);
}
.btn-ghost {
  background: transparent;
  color: var(--text);
  border-color: var(--border-2);
}
.btn-ghost:hover {
  border-color: var(--accent-2);
  color: var(--accent-2);
  box-shadow: var(--glow-2);
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.6rem;
  transition: transform 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.card:hover {
  transform: translateY(-3px);
  border-color: var(--accent-dim);
  box-shadow: var(--shadow);
}

.badge {
  font-size: 0.62rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  font-weight: 600;
}
.badge-new       { color: var(--accent-2); background: rgba(34,211,238,0.10); border: 1px solid rgba(34,211,238,0.25); }
.badge-active    { color: var(--success);  background: rgba(78,201,148,0.10); border: 1px solid rgba(78,201,148,0.25); }
.badge-pending   { color: var(--warning);  background: rgba(240,192,96,0.10); border: 1px solid rgba(240,192,96,0.25); }
.badge-stopped   { color: var(--danger);   background: rgba(244,112,103,0.10); border: 1px solid rgba(244,112,103,0.25); }

/* Scroll reveal */
.reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.7s cubic-bezier(.22,1,.36,1),
              transform 0.7s cubic-bezier(.22,1,.36,1);
}
.reveal.visible { opacity: 1; transform: translateY(0); }
```

---

## SCROLL REVEAL COMPOSABLE

Maak `frontend/src/composables/useReveal.js`:

```javascript
import { onMounted, onBeforeUnmount } from 'vue'

export function useReveal() {
  let observer
  onMounted(() => {
    const els = document.querySelectorAll('.reveal')
    observer = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          setTimeout(() => e.target.classList.add('visible'), i * 80)
          observer.unobserve(e.target)
        }
      })
    }, { threshold: 0.1 })
    els.forEach(el => observer.observe(el))
  })
  onBeforeUnmount(() => observer?.disconnect())
}
```

---

## LOKAAL STARTEN (recipe)

1. **Backend:** vanuit `c:/xampp/htdocs/TDOBBELAER/` → `node server.js` (poort 3001).
2. **Frontend:** vanuit `frontend/` → `npm.cmd run dev` (Vite op 5173, proxy naar 3001).
3. Open http://localhost:5173/.

> Op deze Windows-machine staat node in `C:\Program Files\nodejs\`. Gebruik **`npm.cmd`** direct (niet `npm`) om PowerShell-PATH-issues te vermijden.

Demo logins (als seed nog actief is op de DB waar je tegen draait):
- Admin: `admin@td-development.nl` / `demo1234`
- Klant: `klant@demo.nl` / `demo1234`

---

## HARDE REGELS — FRONTEND

- `<script setup>` syntax in elk Vue-component, geen Options API.
- Geen hardcoded URLs naar `localhost:3001` — gebruik **relatieve** paden (`/api/...`, `/uploads/...`); de Vite-proxy lost dat op en in productie staat alles op één origin.
- Elke fetch via `composables/api.js` — niet rauwe `fetch` strooien (zodat 401-handling consistent is).
- Loading-state tonen tijdens fetches; success/error tonen via toast (`stores/admin.js` heeft een toast-array, of maak een aparte `stores/ui.js` als nodig).
- Forms: client-side validatie vóór POST.
- Geen TODO-placeholders — elk bestand af.
- Niets duplicaten: als een component al bestaat, **bewerk** het. Voeg geen `HeroSliderV2.vue` toe.
- Geen overbodige libraries toevoegen — Tailwind, Element Plus, Vuetify e.d. zijn er bewust níet.
- Bij DB-schema-wijziging: pas **`scripts/migrate.js`** aan en zeg het hardop tegen de gebruiker (zodat hij beslist wanneer hij migreert) — voer het zelf nooit uit tegen live.

---

## VOLGORDE VAN BOUWEN (alleen wat nog mist of bewerkt moet)

Werk uit dit lijstje wat nog open staat in de huidige codebase:

1. CSS-variabelen + base styles in `frontend/src/styles/`.
2. `stores/auth.js`, `stores/site.js`, `stores/admin.js` — controleer dat alle endpoints correct gemapped zijn.
3. `composables/api.js`, `composables/socket.js`, `composables/autosave.js`.
4. `components/layout/MeshBackground.vue`, `SiteNav.vue`, `SiteFooter.vue`.
5. `components/public/HeroSlider.vue`, `PackageCard.vue`, `BlockRenderer.vue`.
6. `components/admin/ImageUpload.vue`, `RichTextEditor.vue`.
7. `views/HomeView.vue` met `site` store integratie.
8. `views/PageView.vue` (`/:slug`).
9. `views/LoginView.vue`, `ContactView.vue`, `QuoteView.vue`, `PortalView.vue`.
10. `views/admin/AdminLayout.vue` + sidebar.
11. `views/admin/AdminDashboard.vue` + socket-toasts.
12. `views/admin/AdminSettings.vue` (kleuren live preview).
13. `views/admin/AdminPages.vue` + autosave.
14. `views/admin/AdminHero.vue` + drag-reorder.
15. `views/admin/AdminPackages.vue`.
16. `views/admin/AdminBlocks.vue`.
17. `views/admin/AdminCustomers.vue` + sub-CRUD services.
18. `views/admin/AdminMessages.vue` + ongelezen-badge.

Voeg pas iets nieuws toe als de gebruiker er expliciet om vraagt — geen extra views, marketingsecties of features die niet in deze prompt staan.

---

## OPEN PUNTEN (laat staan, beslissing aan gebruiker)

- Deploy-strategie naar live (FTP / git pull / rsync) is nog niet vastgelegd.
- E-mail bij `/api/contact` (Nodemailer) staat nog niet in `server.js` — toevoegen op verzoek.
- Wachtwoord-reset flow voor klanten is nog niet geïmplementeerd.

Start nu. Maak elk bestand volledig en werkend, en bevestig per stap welk bestand je hebt aangepast.
