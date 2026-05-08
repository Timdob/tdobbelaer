import { defineStore } from 'pinia'
import { api } from '../composables/api'
import { connectSocket } from '../composables/socket'

const stripSlash = (slug = '') => slug.replace(/^\/+/, '') || 'home'

const normalizePage = (page = {}) => ({
  ...page,
  slug: stripSlash(page.slug),
  excerpt: page.excerpt || '',
  showInNav: page.showInNav ?? page.slug !== '/',
  sortOrder: page.sortOrder || 0,
  seoTitle: page.seoTitle || '',
  seoDescription: page.seoDescription || '',
  ogImage: page.ogImage || '',
  noIndex: Boolean(page.noIndex),
  sections: Array.isArray(page.sections) ? page.sections : [],
})

const normalizeBlock = (block = {}) => ({
  id: block.id,
  type: block.type || (block.key === 'portal' ? 'cta' : 'feature'),
  title: block.title || '',
  subtitle: block.subtitle || block.label || '',
  body: block.body || (block.text ? `<p>${block.text}</p>` : ''),
  imageUrl: block.imageUrl || '',
  ctaLabel: block.ctaLabel || '',
  ctaUrl: block.ctaUrl || '',
  enabled: block.enabled !== false,
  sortOrder: block.sortOrder || 0,
  width: block.width || 'full',
  variant: block.variant || 'default',
  items: Array.isArray(block.items) ? block.items : [],
})

const fallbackHeroSlides = (settings = {}) => [{
  id: 'settings-hero',
  title: settings.heroTitle || settings.brandName || 'TD Development',
  subtitle: settings.heroText || settings.tagline || '',
  badge: settings.badge || 'Maatwerk websites',
  ctaLabel: settings.primaryCta || 'Contact opnemen',
  ctaUrl: '/contact',
  visualLabel: settings.heroVisualLabel || 'Live CMS',
  visualTitle: settings.heroVisualTitle || 'Elke homepage sectie is beheerbaar',
  visualItems: settings.heroVisualItems || 'Design\nDevelopment\nBeheer',
}]

const fallbackPackages = [
  {
    id: 'starter',
    name: 'Starter',
    price: 799,
    period: 'eenmalig',
    description: 'Een snelle, strakke website voor ondernemers die professioneel online willen staan.',
    features: 'Responsive design\nTot 3 pagina\'s\nContact CTA\nBasis SEO',
    ctaLabel: 'Kies Starter',
    ctaUrl: '/contact',
    highlighted: false,
  },
  {
    id: 'business',
    name: 'Business',
    price: 1899,
    period: 'eenmalig',
    description: 'Een complete website met beheerbare content, conversiegerichte secties en klantportaal-basis.',
    features: 'CMS beheer\nHomepage blokken\nKlantportaal-basis\nUitgebreide SEO\nAnalytics-ready',
    ctaLabel: 'Kies Business',
    ctaUrl: '/contact',
    highlighted: true,
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 349,
    period: 'per maand',
    description: 'Doorlopende hosting, onderhoud, optimalisatie en support voor groeiende bedrijven.',
    features: 'Hosting & updates\nMonitoring\nContent support\nMaandrapportage\nPrioriteit support',
    ctaLabel: 'Plan gesprek',
    ctaUrl: '/contact',
    highlighted: false,
  },
]

const hexToRgb = (value) => {
  const color = String(value || '').trim().toLowerCase()
  const match = /^#([0-9a-f]{3}|[0-9a-f]{6})$/.exec(color)
  if (!match) return null
  const hex = match[1].length === 3
    ? match[1].split('').map((char) => char + char).join('')
    : match[1]
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  }
}

const isTooDark = (value, threshold = 26) => {
  const rgb = hexToRgb(value)
  if (!rgb) return false
  const luminance = (0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b)
  return luminance < threshold
}

const luminance = (value) => {
  const rgb = hexToRgb(value)
  if (!rgb) return null
  return (0.2126 * rgb.r) + (0.7152 * rgb.g) + (0.0722 * rgb.b)
}

const isPurpleOrNeon = (value) => {
  const rgb = hexToRgb(value)
  if (!rgb) return false
  const l = luminance(value)
  const purple = rgb.r > 95 && rgb.b > 135 && rgb.g < 115
  const neon = l > 185 && (rgb.g > 180 || rgb.b > 180)
  return purple || neon
}

const normalizeThemeColor = (value, fallback, replacements = {}, options = {}) => {
  const color = String(value || '').trim().toLowerCase()
  if (options.replaceVeryDark && isTooDark(color, options.darkThreshold)) return fallback
  return replacements[color] || value || fallback
}

const readableText = (value, fallback = '#132033') => {
  const l = luminance(value)
  if (l === null || l > 128) return fallback
  return value
}

const readableMuted = (value, fallback = '#526172') => {
  const l = luminance(value)
  if (l === null || l > 150) return fallback
  return value
}

const calmAccent = (value, fallback) => {
  if (!value || isPurpleOrNeon(value)) return fallback
  return value
}

const lightThemeReplacements = {
  '#000': '#f7f3ea',
  '#000000': '#f7f3ea',
  '#06111f': '#f7f3ea',
  '#0a0e1a': '#f7f3ea',
  '#111827': '#f7f3ea',
}

const lightSurfaceReplacements = {
  '#000': '#fffdf8',
  '#000000': '#fffdf8',
  '#0c1728': '#fffdf8',
  '#11162a': '#fffdf8',
  '#1b2235': '#fffdf8',
}

export const useSiteStore = defineStore('site', {
  state: () => ({
    settings: null,
    heroSlides: [],
    packages: [],
    blocks: [],
    pages: [],
    loaded: false,
    loading: false,
    listening: false,
  }),
  getters: {
    navPages: (s) => [...s.pages]
      .filter((p) => p.published !== false && p.showInNav)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || String(a.title || '').localeCompare(String(b.title || ''))),
    homePage: (s) => s.pages.find((p) => p.slug === 'home') || null,
    pageBySlug: (s) => (slug) => s.pages.find((p) => p.slug === slug) || null,
  },
  actions: {
    async loadPublic(force = false) {
      return this.load(force)
    },
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      try {
        const data = await api.get('/api/public')
        this.settings = data.settings
        this.heroSlides = (data.heroSlides?.length ? data.heroSlides : fallbackHeroSlides(data.settings))
        this.packages = data.packages?.length ? data.packages : fallbackPackages
        this.blocks = (data.blocks || []).map(normalizeBlock).filter((b) => b.enabled)
        this.pages = (data.pages || []).map(normalizePage)
        this.loaded = true
        this.applyTheme()
      } finally {
        this.loading = false
      }
    },
    applyTheme() {
      const r = document.documentElement.style
      const theme = {
        '--bg': '#f3eadb',
        '--surface': '#fffaf1',
        '--text': '#132033',
        '--muted': '#526172',
        '--accent': '#0f766e',
        '--accent-2': '#b56f16',
        '--text-inverse': '#ffffff',
      }
      Object.entries(theme).forEach(([name, value]) => r.setProperty(name, value))
    },
    listenToUpdates() {
      if (this.listening) return
      this.listening = true
      const socket = connectSocket()
      socket.on('site:updated', () => this.load(true))
    },
  },
})
