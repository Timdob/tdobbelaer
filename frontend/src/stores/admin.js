import { defineStore } from 'pinia'
import { api } from '../composables/api'
import { connectSocket } from '../composables/socket'
import { useSiteStore } from './site'

async function refreshPublicSite() {
  const site = useSiteStore()
  await site.load(true)
}

export const useAdminStore = defineStore('admin', {
  state: () => ({
    settings: null,
    heroSlides: [],
    packages: [],
    serviceAddons: [],
    blocks: [],
    mailTemplates: [],
    mailLogs: [],
    pages: [],
    media: [],
    customers: [],
    messages: [],
    chatSessions: [],
    toasts: [],
    loaded: false,
    loading: false,
    realtimeStarted: false,
    realtimeUnsubscribers: [],
  }),
  getters: {
    messagesUnread: (s) => s.messages.filter((m) => m.status === 'nieuw').length,
    chatUnread: (s) => s.chatSessions.reduce((sum, sess) => sum + (sess.adminUnread || 0), 0),
  },
  actions: {
    async loadAll(force = false) {
      return this.load(force)
    },
    async load(force = false) {
      if (this.loaded && !force) return
      this.loading = true
      try {
        const d = await api.get('/api/admin/data')
        Object.assign(this, d)
        this.loaded = true
      } finally { this.loading = false }
    },
    async saveSettings(s) {
      this.settings = await api.put('/api/admin/settings', s)
      await refreshPublicSite()
    },
    async saveQuoteConfig(config) {
      const saved = await api.put('/api/admin/quote-config', config)
      this.settings = { ...(this.settings || {}), quoteConfig: saved }
      await refreshPublicSite()
      return saved
    },

    async createPage(p) {
      const r = await api.post('/api/admin/pages', p)
      this.pages.push(r)
      await refreshPublicSite()
      return r
    },
    async updatePage(p) {
      const r = await api.put(`/api/admin/pages/${p.id}`, p)
      this._replace('pages', r)
      await refreshPublicSite()
      return r
    },
    async deletePage(id) {
      await api.del(`/api/admin/pages/${id}`)
      this.pages = this.pages.filter((x) => x.id !== id)
      await refreshPublicSite()
    },

    async loadMedia() {
      const r = await api.get('/api/admin/media')
      this.media = r.media
      return this.media
    },

    async loadMailTemplates() {
      const r = await api.get('/api/admin/mail-templates')
      this.mailTemplates = r.templates
      this.mailLogs = r.logs || []
      return r
    },
    async loadMailLogs() {
      const r = await api.get('/api/admin/mail-logs')
      this.mailLogs = r.logs || []
      return this.mailLogs
    },
    async updateMailTemplate(template) {
      const r = await api.put(`/api/admin/mail-templates/${template.id}`, template)
      this._replace('mailTemplates', r)
      return r
    },
    async sendMailTemplate(id, payload) {
      return api.post(`/api/admin/mail-templates/${id}/send`, payload)
    },

    async previewPage(id) {
      return api.get(`/api/admin/page-preview/${id}`)
    },

    async createSlide(s) {
      const r = await api.post('/api/admin/hero-slides', s)
      this.heroSlides.push(r)
      await refreshPublicSite()
      return r
    },
    async updateSlide(s) {
      const r = await api.put(`/api/admin/hero-slides/${s.id}`, s)
      this._replace('heroSlides', r)
      await refreshPublicSite()
      return r
    },
    async deleteSlide(id) {
      await api.del(`/api/admin/hero-slides/${id}`)
      this.heroSlides = this.heroSlides.filter((x) => x.id !== id)
      await refreshPublicSite()
    },

    async createPackage(p) {
      const r = await api.post('/api/admin/packages', p)
      this.packages.push(r)
      await refreshPublicSite()
      return r
    },
    async updatePackage(p) {
      const r = await api.put(`/api/admin/packages/${p.id}`, p)
      this._replace('packages', r)
      await refreshPublicSite()
      return r
    },
    async deletePackage(id) {
      await api.del(`/api/admin/packages/${id}`)
      this.packages = this.packages.filter((x) => x.id !== id)
      await refreshPublicSite()
    },

    async createServiceAddon(item) {
      const r = await api.post('/api/admin/service-addons', item)
      this.serviceAddons.push(r)
      return r
    },
    async updateServiceAddon(item) {
      const r = await api.put(`/api/admin/service-addons/${item.id}`, item)
      this._replace('serviceAddons', r)
      return r
    },
    async deleteServiceAddon(id) {
      await api.del(`/api/admin/service-addons/${id}`)
      this.serviceAddons = this.serviceAddons.filter((x) => x.id !== id)
    },

    async createBlock(b) {
      const r = await api.post('/api/admin/blocks', b)
      this.blocks.push(r)
      await refreshPublicSite()
      return r
    },
    async updateBlock(b) {
      const r = await api.put(`/api/admin/blocks/${b.id}`, b)
      this._replace('blocks', r)
      await refreshPublicSite()
      return r
    },
    async deleteBlock(id) {
      await api.del(`/api/admin/blocks/${id}`)
      this.blocks = this.blocks.filter((x) => x.id !== id)
      await refreshPublicSite()
    },

    async createCustomer(c) { const r = await api.post('/api/admin/customers', c); this.customers.push(r); return r },
    async updateCustomer(c) { const r = await api.put(`/api/admin/customers/${c.id}`, c); return r },
    async deleteCustomer(id) { await api.del(`/api/admin/customers/${id}`); this.customers = this.customers.filter((x) => x.id !== id) },

    async createService(customerId, s) {
      const r = await api.post(`/api/admin/customers/${customerId}/services`, s)
      const c = this.customers.find((x) => x.id === customerId)
      if (c) c.services.push(r)
      return r
    },
    async updateService(customerId, s) {
      const r = await api.put(`/api/admin/services/${s.id}`, s)
      return r
    },
    async deleteService(customerId, id) {
      await api.del(`/api/admin/services/${id}`)
      const c = this.customers.find((x) => x.id === customerId)
      if (c) c.services = c.services.filter((x) => x.id !== id)
    },

    async loadMessages() {
      const r = await api.get('/api/admin/messages')
      this.messages = r.messages
      return this.messages
    },
    async markMessageRead(id) {
      const r = await api.put(`/api/admin/messages/${id}/read`, {})
      this._replace('messages', r)
      return r
    },
    async deleteMessage(id) {
      await api.del(`/api/admin/messages/${id}`)
      this.messages = this.messages.filter((x) => x.id !== id)
    },

    startRealtime() {
      if (this.realtimeStarted) return
      this.realtimeStarted = true
      const socket = connectSocket()

      const refreshMessages = async () => {
        const known = new Set(this.messages.map((m) => m.id))
        await this.loadMessages()
        const fresh = this.messages.find((m) => m.status === 'nieuw' && !known.has(m.id))
        if (fresh) this.toast(`Nieuw bericht van ${fresh.name || 'websitebezoeker'}`, 'info')
      }

      socket.on('messages:updated', refreshMessages)
      const onNewMessage = async (message) => {
        await refreshMessages()
        if (message?.name) this.toast(`Nieuw bericht van ${message.name}`, 'info')
      }
      const onQuoteUpdate = (payload) => {
        this.toast(payload?.message || 'Offerte bijgewerkt', 'info')
      }
      const refreshChatSessions = async () => {
        try {
          const r = await api.get('/api/admin/chat/sessions')
          this.chatSessions = r.sessions || []
        } catch {}
      }

      const onChatMessage = async (message) => {
        const prevUnread = this.chatUnread
        await refreshChatSessions()
        if (this.chatUnread > prevUnread) {
          const sess = this.chatSessions.find((s) => Number(s.id) === Number(message?.sessionId))
          const name = sess?.visitorName || sess?.visitorEmail || 'Websitebezoeker'
          this.toast(`Nieuw chatbericht van ${name}`, 'chat')
        }
      }

      const onChatSessions = (items) => {
        const prevUnread = this.chatUnread
        this.chatSessions = items || []
        if (this.chatUnread > prevUnread) {
          this.toast('Nieuw chatbericht ontvangen', 'chat')
        }
      }

      socket.on('chat:message', onChatMessage)
      socket.on('chat:sessions', onChatSessions)

      socket.on('nieuw-bericht', onNewMessage)
      socket.on('offerte-update', onQuoteUpdate)
      this.realtimeUnsubscribers = [
        () => socket.off('messages:updated', refreshMessages),
        () => socket.off('nieuw-bericht', onNewMessage),
        () => socket.off('offerte-update', onQuoteUpdate),
        () => socket.off('chat:message', onChatMessage),
        () => socket.off('chat:sessions', onChatSessions),
      ]

      refreshChatSessions()
    },

    stopRealtime() {
      this.realtimeUnsubscribers.forEach((off) => off())
      this.realtimeUnsubscribers = []
      this.realtimeStarted = false
    },

    toast(message, type = 'info') {
      const id = Date.now() + Math.random()
      this.toasts.push({ id, message, type })
      window.setTimeout(() => this.dismissToast(id), 4500)
      return id
    },

    dismissToast(id) {
      this.toasts = this.toasts.filter((t) => t.id !== id)
    },

    _replace(key, item) {
      this[key] = this[key].map((x) => x.id === item.id ? item : x)
    },
  },
})
