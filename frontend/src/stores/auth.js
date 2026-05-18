import { defineStore } from 'pinia'
import { connectSocket, disconnectSocket } from '../composables/socket'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('td_token') || '',
    user: JSON.parse(localStorage.getItem('td_user') || 'null'),
    lastLogin: localStorage.getItem('td_last_login') || null,
  }),
  getters: {
    isAuth: (s) => Boolean(s.token),
    isLoggedIn: (s) => Boolean(s.token),
    isAdmin: (s) => s.user?.role === 'admin',
    isClient: (s) => s.user?.role === 'client' || s.user?.role === 'customer',
  },
  actions: {
    authHeader() {
      return this.token ? { Authorization: `Bearer ${this.token}` } : {}
    },
    async login(email, password) {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Login mislukt.')
      this.setSession(data.token, data.user)
      return data
    },
    async fetchMe() {
      if (!this.token) return null
      const res = await fetch('/api/auth/me', { headers: this.authHeader() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        this.logout()
        throw new Error(data.message || 'Niet ingelogd')
      }
      this.user = data.user
      localStorage.setItem('td_user', JSON.stringify(data.user))
      connectSocket()
      return data.user
    },
    setSession(token, user) {
      this.token = token
      this.user = user
      if (user?.lastLogin !== undefined) {
        this.lastLogin = user.lastLogin ?? null
        localStorage.setItem('td_last_login', user.lastLogin ?? '')
      }
      localStorage.setItem('td_token', token)
      localStorage.setItem('td_user', JSON.stringify(user))
      connectSocket()
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('td_token')
      localStorage.removeItem('td_user')
      disconnectSocket()
    },
  },
})
