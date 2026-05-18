import { defineStore } from 'pinia'

export const DEFAULT_QUOTE_CONFIG = {
  steps: [
    {
      key: 'branche',
      label: 'Branche',
      eyebrow: 'Stap 1 van 3',
      title: 'Voor welke branche bouwen we?',
      lead: 'Kies wat het dichtst bij jouw bedrijf aansluit. Dit helpt om functies te tonen die passen bij jouw markt.',
    },
    {
      key: 'wensen',
      label: 'Wensen',
      eyebrow: 'Stap 2 van 3',
      title: 'Wat wil je dat de site kan?',
      lead: 'Vink alles aan dat je nodig hebt. De prijsindicatie rechts werkt live mee.',
    },
    {
      key: 'gegevens',
      label: 'Gegevens',
      eyebrow: 'Stap 3 van 3',
      title: 'Laat je gegevens achter',
      lead: 'Ik neem binnen 1 werkdag contact op met een voorstel op maat.',
    },
  ],
  branches: [
  { id: 'kapper', icon: 'KB', label: 'Kapper / Beauty' },
  { id: 'horeca', icon: 'HC', label: 'Horeca' },
  { id: 'bouw', icon: 'BV', label: 'Bouw / Vakman' },
  { id: 'fitness', icon: 'FT', label: 'Fitness' },
  { id: 'tuin', icon: 'TN', label: 'Tuin / Natuur' },
  { id: 'winkel', icon: 'RT', label: 'Winkel / Retail' },
  { id: 'zorg', icon: 'ZG', label: 'Zorg / Gezondheid' },
  { id: 'anders', icon: 'AD', label: 'Anders' },
  ],
  wishes: [
  { id: 'website', icon: 'WEB', label: 'Informatie website', priceMin: 0, priceMax: 0 },
  { id: 'afspraken', icon: 'CAL', label: 'Online afspraken', priceMin: 0, priceMax: 0 },
  { id: 'portfolio', icon: 'FOL', label: 'Menu / Portfolio', priceMin: 0, priceMax: 0 },
  { id: 'webshop', icon: 'SHOP', label: 'Webshop', priceMin: 500, priceMax: 800 },
  { id: 'blog', icon: 'BLOG', label: 'Blog / Nieuws', priceMin: 0, priceMax: 0 },
  { id: 'klantportaal', icon: 'PORT', label: 'Klantportaal', priceMin: 300, priceMax: 500 },
  { id: 'reserveringen', icon: 'BOOK', label: 'Reserveringssysteem', priceMin: 200, priceMax: 400 },
  { id: 'whatsapp', icon: 'APP', label: 'WhatsApp integratie', priceMin: 0, priceMax: 0 },
  ],
  fields: {
    nameLabel: 'Naam',
    companyLabel: 'Bedrijfsnaam',
    emailLabel: 'E-mail',
    phoneLabel: 'Telefoon',
    hasWebsiteLabel: 'Heb je al een website?',
    websiteUrlLabel: 'Website URL',
    liveLabel: 'Wanneer live?',
    extraInfoLabel: 'Toelichting (optioneel)',
    extraInfoPlaceholder: 'Specifieke wensen, voorbeelden, links...',
  },
  liveOptions: ['zo snel mogelijk', 'binnen 1 maand', 'binnen 3 maanden', 'nog aan het orienteren'],
  extraQuestions: [],
  pricing: {
    baseMin: 799,
    baseMax: 1299,
    extraMin: 200,
    extraMax: 300,
    extraThreshold: 4,
  },
}

export const BRANCHES = DEFAULT_QUOTE_CONFIG.branches
export const WENSEN = DEFAULT_QUOTE_CONFIG.wishes

const initialGegevens = () => ({
  naam: '',
  bedrijfsnaam: '',
  email: '',
  telefoon: '',
  heeftWebsite: 'nee',
  websiteUrl: '',
  wanneerLive: 'zo snel mogelijk',
  extraInfo: '',
  extraAnswers: {},
})

const mergeConfig = (config) => {
  const c = config || {}
  return {
    ...DEFAULT_QUOTE_CONFIG,
    ...c,
    steps: DEFAULT_QUOTE_CONFIG.steps.map((step, index) => ({ ...step, ...(c.steps?.[index] || {}) })),
    branches: Array.isArray(c.branches) && c.branches.length ? c.branches : DEFAULT_QUOTE_CONFIG.branches,
    wishes: Array.isArray(c.wishes) && c.wishes.length ? c.wishes : DEFAULT_QUOTE_CONFIG.wishes,
    fields: { ...DEFAULT_QUOTE_CONFIG.fields, ...(c.fields || {}) },
    liveOptions: Array.isArray(c.liveOptions) && c.liveOptions.length ? c.liveOptions : DEFAULT_QUOTE_CONFIG.liveOptions,
    extraQuestions: Array.isArray(c.extraQuestions) ? c.extraQuestions : [],
    pricing: { ...DEFAULT_QUOTE_CONFIG.pricing, ...(c.pricing || {}) },
  }
}

export const useOfferteStore = defineStore('offerte', {
  state: () => ({
    huidigeStap: 1,
    branche: '',
    wensen: [],
    gekozenPakket: null,
    config: null,
    gegevens: initialGegevens(),
    verzonden: false,
  }),
  getters: {
    quoteConfig: (s) => mergeConfig(s.config),
    branches: (s) => mergeConfig(s.config).branches,
    wishes: (s) => mergeConfig(s.config).wishes,
    stepLabels: (s) => mergeConfig(s.config).steps.map((step) => step.label),
    fields: (s) => mergeConfig(s.config).fields,
    brancheLabel: (s) => mergeConfig(s.config).branches.find((b) => b.id === s.branche)?.label || '',
    wensenLabels: (s) => s.wensen.map((id) => mergeConfig(s.config).wishes.find((w) => w.id === id)?.label).filter(Boolean),
    prijsIndicatie: (s) => {
      const cfg = mergeConfig(s.config)
      const pricing = cfg.pricing
      let min = s.gekozenPakket?.price
        ? Number(s.gekozenPakket.price)
        : Number(pricing.baseMin || 799)
      let max = s.gekozenPakket?.price
        ? Number(s.gekozenPakket.price)
        : Number(pricing.baseMax || 1299)
      const pakketWishIds = s.gekozenPakket?.wishIds || []
      for (const wish of cfg.wishes) {
        if (s.wensen.includes(wish.id) && !pakketWishIds.includes(wish.id)) {
          min += Number(wish.priceMin || 0)
          max += Number(wish.priceMax || 0)
        }
      }
      const threshold = Number(pricing.extraThreshold || 4)
      if (s.wensen.length > threshold) {
        min += Number(pricing.extraMin || 0)
        max += Number(pricing.extraMax || 0)
      }
      return { min, max }
    },
    pakketNaam: (s) => {
      if (s.gekozenPakket?.name) return s.gekozenPakket.name
      if (s.wensen.includes('webshop') || s.wensen.includes('klantportaal')) return 'Premium'
      if (s.wensen.length > 2) return 'Business'
      return 'Starter'
    },
    kanVerder: (s) => {
      if (s.huidigeStap === 1) return Boolean(s.branche)
      if (s.huidigeStap === 2) return s.wensen.length > 0
      return true
    },
  },
  actions: {
    setConfig(config) { this.config = config || null },
    setBranche(id) { this.branche = id },
    setPakket(pkg) {
      this.gekozenPakket = pkg ? {
        id: pkg.id,
        name: pkg.name,
        price: Number(pkg.price || 0),
        period: pkg.period || '',
        description: pkg.description || '',
        features: pkg.features || '',
        wishIds: Array.isArray(pkg.wishIds) ? pkg.wishIds : [],
      } : null
      // Vink wensen die bij het pakket horen automatisch aan
      if (pkg?.wishIds?.length && !this.wensen.length) {
        this.wensen = [...pkg.wishIds]
      }
    },
    toggleWens(id) {
      const index = this.wensen.indexOf(id)
      if (index === -1) this.wensen.push(id)
      else this.wensen.splice(index, 1)
    },
    volgendeStap() {
      if (this.huidigeStap < 3 && this.kanVerder) this.huidigeStap += 1
    },
    vorigeStap() {
      if (this.huidigeStap > 1) this.huidigeStap -= 1
    },
    naarStap(stap) {
      if (stap >= 1 && stap <= 3 && stap <= this.huidigeStap) this.huidigeStap = stap
    },
    reset() {
      this.huidigeStap = 1
      this.branche = ''
      this.wensen = []
      this.gekozenPakket = null
      this.config = this.config
      this.gegevens = initialGegevens()
      this.verzonden = false
    },
    bouwBerichtBody() {
      const { min, max } = this.prijsIndicatie
      const chosen = this.gekozenPakket
      return [
        chosen ? `Gekozen pakket: ${chosen.name}` : 'Gekozen pakket: geen pakket gekozen',
        chosen?.price ? `Pakketprijs: EUR ${chosen.price} ${chosen.period || ''}`.trim() : '',
        chosen?.features ? `Pakket features: ${String(chosen.features).split('\n').filter(Boolean).join(', ')}` : '',
        `Branche: ${this.brancheLabel}`,
        `Wensen: ${this.wensenLabels.join(', ')}`,
        `Aanbevolen pakket: ${this.pakketNaam}`,
        `Prijsindicatie: EUR ${min} - EUR ${max}`,
        `Heeft al een website: ${this.gegevens.heeftWebsite}`,
        this.gegevens.heeftWebsite === 'ja' ? `Website URL: ${this.gegevens.websiteUrl || '-'}` : '',
        `Wanneer live: ${this.gegevens.wanneerLive}`,
        ...this.quoteConfig.extraQuestions.map((question) =>
          `${question.label}: ${this.gegevens.extraAnswers?.[question.id] || '-'}`),
        '',
        this.gegevens.extraInfo || '(geen extra toelichting)',
      ].filter((line) => line !== '').join('\n')
    },
  },
})
