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
        <button
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: activeSession?.id === session.id }"
          type="button"
          @click="openSession(session)"
        >
          <span>
            <strong>{{ session.visitorName || 'Websitebezoeker' }}</strong>
            <small>{{ session.visitorEmail || session.visitorId }}</small>
          </span>
          <em v-if="session.adminUnread">{{ session.adminUnread }}</em>
          <p>{{ session.lastMessage || 'Nog geen berichten.' }}</p>
        </button>
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
              <p>{{ message.body }}</p>
            </div>
            <p v-if="!messages.length" class="muted">Nog geen berichten in dit gesprek.</p>
          </div>

          <form class="reply" @submit.prevent="sendReply">
            <input
              v-model="reply"
              class="input"
              placeholder="Typ je antwoord..."
              maxlength="2000"
              :disabled="sending"
            />
            <button class="btn btn-primary" type="submit" :disabled="sending || !reply.trim()">Stuur</button>
          </form>
        </template>
        <div v-else class="empty-state">
          <h2>Selecteer een gesprek</h2>
          <p class="muted">Nieuwe berichten verschijnen automatisch in deze lijst.</p>
        </div>
      </article>
    </section>
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
  if (!activeSession.value || !reply.value.trim()) return
  sending.value = true
  try {
    await emitAck('chat:admin:message', {
      sessionId: activeSession.value.id,
      body: reply.value,
    })
    reply.value = ''
  } catch (e) {
    admin.toast(e.message)
  } finally {
    sending.value = false
  }
}

async function toggleStatus() {
  if (!activeSession.value) return
  const nextStatus = activeSession.value.status === 'closed' ? 'open' : 'closed'
  activeSession.value = await api.put(`/api/admin/chat/sessions/${activeSession.value.id}/status`, { status: nextStatus })
  await loadSessions()
}

function onMessage(message) {
  if (activeSession.value && Number(message.sessionId) === Number(activeSession.value.id)) {
    if (!messages.value.some((m) => m.id === message.id)) messages.value.push(message)
    scrollDown()
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
  socket.on('chat:sessions', (items) => { sessions.value = items || [] })
  socket.on('chat:settings', (value) => { settings.value = value })
  await emitAck('chat:admin:join', {})
})

onBeforeUnmount(() => {
  if (!socket) return
  socket.off('chat:message', onMessage)
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
  grid-template-columns: 1fr auto;
  gap: 7px 12px;
  padding: 14px 18px;
  border: 0;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  text-align: left;
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
.message p {
  margin: 0;
  padding: 11px 13px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field-bg);
  color: var(--text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.message.admin {
  align-self: flex-end;
  align-items: flex-end;
}
.message.admin p {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}
.reply {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 16px;
  border-top: 1px solid var(--border);
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
