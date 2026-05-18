import { useAuthStore } from '../stores/auth'

const base = ''

async function request(method, url, body) {
  const auth = useAuthStore()
  const headers = { 'Content-Type': 'application/json' }
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`

  const res = await fetch(base + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      const preview = text.replace(/\s+/g, ' ').slice(0, 160)
      throw new Error(`Server gaf geen JSON terug: ${preview}`)
    }
  }

  if (!res.ok) {
    if (res.status === 401) auth.logout()
    throw new Error(data?.message || `Fout (${res.status})`)
  }
  return data
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b),
  put: (u, b) => request('PUT', u, b),
  patch: (u, b) => request('PATCH', u, b),
  del: (u) => request('DELETE', u),
}
