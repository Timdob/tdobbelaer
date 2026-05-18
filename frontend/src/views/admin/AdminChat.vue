<template>
  <div>
    <header class="head">
      <div>
        <h1>Chat</h1>
        <p class="muted">Zet de websitechat aan of uit en reageer live op bezoekers.</p>
      </div>
      <label class="switch">
        <input v-model="settings.chatEnabled" type="checkbox" @change="saveSettings" />
        <span>{{ settings.chatEnabled ? 'Chat aan' : 'Chat uit' }}</span>
      </label>
    </header>

    <section class="card settings-card">
      <div>
        <label class="label">Welkomstbericht</label>
        <input v-model="settings.chatWelcome" class="input" @change="saveSettings" />
      </div>
      <p v-if="status" class="status">{{ status }}</p>
    </section>

    <section class="chat-admin">
      <aside class="session-list card">
        <div class="list-head">
          <h2>Gesprekken</h2>
          <button class="btn btn-ghost" type="button" @click="loadSessions">Ververs</button>
        </div>
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: activeSession?.id === session.id }"
          @click="openSession(session)"
        >
          <span>
            <strong>{{ session.visitorName || 'Websitebezoeker' }}</strong>
            <small>{{ session.visitorEmail || session.visitorId }}</small>
          </span>
          <em v-if="session.adminUnread">{{ session.adminUnread }}</em>
          <button class="delete-session" type="button" aria-label="Chat verwijderen" @click.stop="deleteSession(session)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M10 11v6M14 11v6M9 7l1-3h4l1 3M8 7l1 13h6l1-13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <p>{{ session.lastMessage || 'Nog geen berichten.' }}</p>
        </div>
        <p v-if="!sessions.length" class="muted">Nog geen chatgesprekken.</p>
      </aside>

      <article class="conversation card">
        <template v-if="activeSession">
          <div class="conversation-head">
            <div>
              <h2>{{ activeSession.visitorName || 'Websitebezoeker' }}</h2>
              <p class="muted small">{{ activeSession.visitorEmail || activeSession.visitorId }}</p>
            </div>
            <button class="btn btn-ghost" type="button" @click="toggleStatus">
              {{ activeSession.status === 'closed' ? 'Heropen' : 'Sluit gesprek' }}
            </button>
          </div>

          <div ref="messagesEl" class="messages">
            <div
              v-for="message in messages"
              :key="message.id"
              class="message"
              :class="message.role"
            >
              <span>{{ message.role === 'admin' ? 'Jij' : 'Bezoeker' }}</span>
              <div v-if="message.role === 'admin'" class="message-actions">
                <button type="button" @click="editAdminMessage(message)">Wijzig</button>
                <button type="button" @click="deleteAdminMessage(message)">Verwijder</button>
              </div>
              <p v-if="message.body">
                <template v-for="part in linkParts(message.body)" :key="part.key">
                  <a v-if="part.url" :href="part.text" target="_blank" rel="noopener noreferrer">{{ part.text }}</a>
                  <template v-else>{{ part.text }}</template>
                </template>
              </p>
              <button
                v-if="message.attachmentUrl"
                class="attachment"
                type="button"
                @click="previewAttachment(message)"
              >
                <img v-if="isImage(message)" :src="message.attachmentUrl" :alt="message.attachmentName || 'Bijlage'" />
                <span v-else>{{ message.attachmentName || 'Bijlage openen' }}</span>
              </button>
            </div>
            <p v-if="!messages.length" class="muted">Nog geen berichten in dit gesprek.</p>
          </div>

          <form class="reply" @submit.prevent="sendReply">
            <input ref="fileInput" type="file" class="file-input" @change="onFileChange" />
            <button class="attach-btn" type="button" :disabled="sending" aria-label="Bijlage toevoegen" @click="fileInput?.click()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 12.5 5.8-5.8a3 3 0 0 1 4.2 4.2l-7.1 7.1a5 5 0 0 1-7.1-7.1l7.4-7.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
            <input
              v-model="reply"
              class="input"
              placeholder="Typ je antwoord..."
              maxlength="2000"
              :disabled="sending"
            />
            <button class="btn btn-primary" type="submit" :disabled="sending || (!reply.trim() && !attachment)">Stuur</button>
          </form>
          <div v-if="attachment" class="selected-file">
            <span>{{ attachment.attachmentName }}</span>
            <button type="button" @click="attachment = null">Verwijder</button>
          </div>
        </template>
        <div v-else class="empty-state">
          <h2>Selecteer een gesprek</h2>
          <p class="muted">Nieuwe berichten verschijnen automatisch in deze lijst.</p>
        </div>
      </article>
    </section>

    <div v-if="preview" class="preview-backdrop" @click.self="preview = null">
      <section class="preview-modal" aria-label="Bijlage voorbeeld">
        <header>
          <div>
            <strong>{{ preview.attachmentName || 'Bijlage' }}</strong>
            <span>{{ preview.attachmentType || 'Bestand' }}</span>
          </div>
          <button type="button" aria-label="Sluiten" @click="preview = null">x</button>
        </header>

        <div class="preview-body">
          <img v-if="isImage(preview)" :src="preview.attachmentUrl" :alt="preview.attachmentName || 'Bijlage'" />
          <iframe v-else-if="preview.attachmentType === 'application/pdf'" :src="preview.attachmentUrl" title="PDF voorbeeld"></iframe>
          <div v-else class="file-preview">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M14 3v5h4M8 13h8M8 17h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
            <p>{{ preview.attachmentName || 'Bestand' }}</p>
            <span>Geen inline voorbeeld beschikbaar.</span>
          </div>
        </div>

        <footer>
          <a class="btn btn-primary" :href="preview.attachmentUrl" target="_blank" rel="noopener noreferrer">Open bestand</a>
          <button class="btn btn-danger" type="button" @click="deleteAttachment(preview)">Verwijder bijlage</button>
          <button class="btn btn-ghost" type="button" @click="preview = null">Sluiten</button>
        </footer>
      </section>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '../../composables/api'
import { connectSocket } from '../../composables/socket'
import { useAuthStore } from '../../stores/auth'
import { useAdminStore } from '../../stores/admin'

const auth = useAuthStore()
const admin = useAdminStore()
const settings = ref({ chatEnabled: false, chatWelcome: '' })
const sessions = ref([])
const activeSession = ref(null)
const messages = ref([])
const reply = ref('')
const status = ref('')
const sending = ref(false)
const messagesEl = ref(null)
const fileInput = ref(null)
const attachment = ref(null)
const preview = ref(null)
let socket = null

function emitAck(event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, { token: auth.token, ...payload }, (response) => {
      if (response?.ok) resolve(response)
      else reject(new Error(response?.message || 'Chat actie mislukt.'))
    })
  })
}

async function loadSettings() {
  settings.value = await api.get('/api/admin/chat/settings')
}

async function saveSettings() {
  status.value = ''
  try {
    const saved = await api.put('/api/admin/chat/settings', settings.value)
    settings.value = {
      chatEnabled: saved.chatEnabled,
      chatWelcome: saved.chatWelcome,
    }
    status.value = 'Opgeslagen.'
    window.setTimeout(() => { status.value = '' }, 1800)
  } catch (e) {
    status.value = e.message
  }
}

async function loadSessions() {
  const r = await api.get('/api/admin/chat/sessions')
  sessions.value = r.sessions || []
  if (activeSession.value) {
    activeSession.value = sessions.value.find((s) => s.id === activeSession.value.id) || activeSession.value
  }
}

async function openSession(session) {
  activeSession.value = session
  const response = socket?.connected
    ? await emitAck('chat:admin:open', { sessionId: session.id })
    : await api.get(`/api/admin/chat/sessions/${session.id}/messages`)
  messages.value = response.messages || []
  await loadSessions()
  scrollDown()
}

async function sendReply() {
  if (!activeSession.value || (!reply.value.trim() && !attachment.value)) return
  sending.value = true
  try {
    await emitAck('chat:admin:message', {
      sessionId: activeSession.value.id,
      body: reply.value,
      ...(attachment.value || {}),
    })
    reply.value = ''
    attachment.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    admin.toast(e.message)
  } finally {
    sending.value = false
  }
}

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Bestand lezen mislukt.'))
    reader.readAsDataURL(file)
  })
}

async function onFileChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  sending.value = true
  try {
    const dataUrl = await readFile(file)
    attachment.value = await api.post('/api/admin/chat/upload', { fileName: file.name, dataUrl })
  } catch (e) {
    admin.toast(e.message)
    event.target.value = ''
  } finally {
    sending.value = false
  }
}

function isImage(message) {
  return String(message.attachmentType || '').startsWith('image/')
}

function previewAttachment(message) {
  preview.value = message
}

function linkParts(text = '') {
  const parts = []
  const pattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi
  let last = 0
  let index = 0
  String(text).replace(pattern, (match, _all, offset) => {
    if (offset > last) parts.push({ key: `${index++}-text`, text: text.slice(last, offset) })
    const href = match.startsWith('http') ? match : `https://${match}`
    parts.push({ key: `${index++}-url`, text: href, url: true })
    last = offset + match.length
    return match
  })
  if (last < text.length) parts.push({ key: `${index++}-text`, text: text.slice(last) })
  return parts.length ? parts : [{ key: 'text', text }]
}

async function toggleStatus() {
  if (!activeSession.value) return
  const nextStatus = activeSession.value.status === 'closed' ? 'open' : 'closed'
  activeSession.value = await api.put(`/api/admin/chat/sessions/${activeSession.value.id}/status`, { status: nextStatus })
  await loadSessions()
}

async function deleteSession(session) {
  if (!window.confirm('Weet je zeker dat je deze chat wilt verwijderen?')) return
  await api.del(`/api/admin/chat/sessions/${session.id}`)
  sessions.value = sessions.value.filter((item) => item.id !== session.id)
  if (activeSession.value?.id === session.id) {
    activeSession.value = null
    messages.value = []
  }
}

async function deleteAttachment(message) {
  if (!window.confirm('Deze bijlage verwijderen? Het tekstbericht blijft staan.')) return
  const updated = await api.del(`/api/admin/chat/messages/${message.id}/attachment`)
  messages.value = messages.value.map((item) => item.id === updated.id ? updated : item)
  preview.value = null
  await loadSessions()
}

async function editAdminMessage(message) {
  const next = window.prompt('Bericht wijzigen', message.body || '')
  if (next === null) return
  try {
    const updated = await api.put(`/api/admin/chat/messages/${message.id}`, { body: next })
    messages.value = messages.value.map((item) => item.id === updated.id ? updated : item)
    await loadSessions()
  } catch (e) {
    admin.toast(e.message)
  }
}

async function deleteAdminMessage(message) {
  if (!window.confirm('Dit bericht verwijderen?')) return
  try {
    await api.del(`/api/admin/chat/messages/${message.id}`)
    messages.value = messages.value.filter((item) => item.id !== message.id)
    if (preview.value?.id === message.id) preview.value = null
    await loadSessions()
  } catch (e) {
    admin.toast(e.message)
  }
}

function onMessage(message) {
  if (activeSession.value && Number(message.sessionId) === Number(activeSession.value.id)) {
    if (!messages.value.some((m) => m.id === message.id)) messages.value.push(message)
    scrollDown()
  }
  loadSessions()
}

function onMessageUpdated(message) {
  messages.value = messages.value.map((item) => item.id === message.id ? message : item)
  if (preview.value?.id === message.id) preview.value = null
  loadSessions()
}

function onMessageDeleted({ id, sessionId } = {}) {
  if (activeSession.value && Number(sessionId) === Number(activeSession.value.id)) {
    messages.value = messages.value.filter((item) => item.id !== id)
    if (preview.value?.id === id) preview.value = null
  }
  loadSessions()
}

function scrollDown() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

onMounted(async () => {
  await Promise.all([loadSettings(), loadSessions()])
  socket = connectSocket()
  socket.on('chat:message', onMessage)
  socket.on('chat:message:updated', onMessageUpdated)
  socket.on('chat:message:deleted', onMessageDeleted)
  socket.on('chat:deleted', ({ sessionId } = {}) => {
    sessions.value = sessions.value.filter((item) => Number(item.id) !== Number(sessionId))
    if (Number(activeSession.value?.id) === Number(sessionId)) {
      activeSession.value = null
      messages.value = []
      preview.value = null
    }
  })
  socket.on('chat:sessions', (items) => { sessions.value = items || [] })
  socket.on('chat:settings', (value) => { settings.value = value })
  await emitAck('chat:admin:join', {})
})

onBeforeUnmount(() => {
  if (!socket) return
  socket.off('chat:message', onMessage)
  socket.off('chat:message:updated', onMessageUpdated)
  socket.off('chat:message:deleted', onMessageDeleted)
  socket.off('chat:deleted')
  socket.off('chat:sessions')
  socket.off('chat:settings')
})
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}
.head h1 {
  font-size: 1.8rem;
  margin-bottom: 4px;
}
.switch {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  font-weight: 800;
}
.switch input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}
.settings-card {
  margin-bottom: 22px;
}
.settings-card:hover,
.session-list:hover,
.conversation:hover {
  transform: none;
}
.status {
  margin: 10px 0 0;
  color: var(--accent);
  font-size: 0.9rem;
}
.chat-admin {
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
  gap: 22px;
  min-height: 620px;
}
.session-list {
  padding: 0;
  overflow: hidden;
}
.list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px;
  border-bottom: 1px solid var(--border);
}
.list-head h2,
.conversation-head h2 {
  font-size: 1.1rem;
  margin: 0;
}
.list-head .btn {
  min-height: 36px;
  padding: 7px 12px;
}
.session-item {
  width: 100%;
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 7px 12px;
  padding: 14px 18px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  text-align: left;
  cursor: pointer;
}
.session-item:hover,
.session-item.active {
  background: var(--surface-hover);
}
.session-item span {
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.session-item small,
.session-item p {
  overflow: hidden;
  color: var(--muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.session-item p {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 0.84rem;
}
.session-item em {
  min-width: 22px;
  height: 22px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: var(--accent);
  color: var(--text-inverse);
  font-style: normal;
  font-size: 0.75rem;
  font-weight: 800;
}
.delete-session {
  width: 30px;
  height: 30px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--danger-border);
  border-radius: var(--radius);
  background: var(--danger-bg);
  color: var(--danger);
}
.delete-session svg {
  width: 17px;
  height: 17px;
}
.conversation {
  display: grid;
  grid-template-rows: auto 1fr auto;
  min-height: 620px;
  padding: 0;
  overflow: hidden;
}
.conversation-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border-bottom: 1px solid var(--border);
}
.conversation-head p {
  margin: 4px 0 0;
}
.messages {
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.message {
  max-width: min(680px, 82%);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.message span {
  color: var(--muted);
  font-size: 0.74rem;
  font-weight: 800;
}
.message-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
.message-actions button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 850;
  padding: 0;
}
.message-actions button:hover {
  color: var(--accent);
}
.message p,
.attachment {
  margin: 0;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field-bg);
  color: var(--text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.message p a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.attachment {
  display: block;
  text-align: left;
  padding: 8px;
  cursor: pointer;
}
.attachment img {
  max-width: 260px;
  max-height: 190px;
  border-radius: 6px;
  object-fit: cover;
}
.attachment span {
  color: var(--accent);
}
.message.admin .attachment span {
  color: var(--text-inverse);
}
.message.admin {
  align-self: flex-end;
  align-items: flex-end;
}
.message.admin p,
.message.admin .attachment {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}
.reply {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid var(--border);
}
.btn-danger {
  background: var(--danger-bg);
  border-color: var(--danger-border);
  color: var(--danger);
}
.file-input {
  display: none;
}
.attach-btn {
  width: 44px;
  min-height: 44px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field-bg);
  color: var(--text);
}
.attach-btn svg {
  width: 21px;
  height: 21px;
}
.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 16px 14px;
  color: var(--muted);
  font-size: 0.86rem;
}
.selected-file button {
  border: 0;
  background: transparent;
  color: var(--danger);
  font-weight: 800;
}
.preview-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 22px;
  background: color-mix(in srgb, var(--text) 54%, transparent);
  backdrop-filter: blur(4px);
}
.preview-modal {
  width: min(940px, 96vw);
  max-height: min(820px, 92vh);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.preview-modal header,
.preview-modal footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}
.preview-modal footer {
  justify-content: flex-end;
  border-top: 1px solid var(--border);
  border-bottom: 0;
}
.preview-modal header div {
  min-width: 0;
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.preview-modal header strong,
.preview-modal header span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.preview-modal header span {
  color: var(--muted);
  font-size: 0.82rem;
}
.preview-modal header button {
  width: 34px;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field-bg);
  color: var(--text);
}
.preview-body {
  min-height: 280px;
  display: grid;
  place-items: center;
  padding: 16px;
  overflow: auto;
  background: color-mix(in srgb, var(--bg) 62%, var(--surface));
}
.preview-body > img {
  max-width: 100%;
  max-height: 68vh;
  border-radius: var(--radius);
  object-fit: contain;
}
.preview-body iframe {
  width: 100%;
  height: 68vh;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.file-preview {
  display: grid;
  place-items: center;
  gap: 8px;
  text-align: center;
}
.file-preview svg {
  width: 56px;
  height: 56px;
  color: var(--accent);
}
.file-preview p {
  margin: 0;
  color: var(--text);
  font-weight: 800;
}
.file-preview span {
  color: var(--muted);
}
.empty-state {
  place-self: center;
  text-align: center;
}
@media (max-width: 980px) {
  .head {
    align-items: flex-start;
    flex-direction: column;
  }
  .chat-admin {
    grid-template-columns: 1fr;
  }
  .conversation {
    min-height: 520px;
  }
}
@media (max-width: 620px) {
  .reply,
  .conversation-head {
    grid-template-columns: 1fr;
    align-items: stretch;
    flex-direction: column;
  }
  .message {
    max-width: 94%;
  }
}
</style>
