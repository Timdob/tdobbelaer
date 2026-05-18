<template>
  <div v-if="chatAvailable" class="chat-widget" :class="{ open }">
    <button v-if="!open" class="chat-launch" type="button" @click="openChat">
      <span class="chat-dot" aria-hidden="true"></span>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H12l-4.2 3.4A.8.8 0 0 1 6.5 17.8V15A3.5 3.5 0 0 1 3 11.5v-5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
      Chat
      <span v-if="unread" class="chat-count">{{ unread }}</span>
    </button>

    <section v-else class="chat-panel" aria-label="Live chat">
      <header class="chat-head">
        <div>
          <strong>Live chat</strong>
          <span>{{ connected ? 'Online' : 'Verbinden...' }}</span>
        </div>
        <button type="button" aria-label="Chat sluiten" @click="open = false">x</button>
      </header>

      <div ref="messagesEl" class="chat-messages">
        <p v-if="welcome" class="chat-system">{{ welcome }}</p>
        <div
          v-for="message in messages"
          :key="message.id"
          class="chat-message"
          :class="message.role"
        >
          <span>{{ message.role === 'admin' ? 'TD Development' : 'Jij' }}</span>
          <div v-if="message.role === 'visitor'" class="message-actions">
            <button type="button" @click="editOwnMessage(message)">Wijzig</button>
            <button type="button" @click="deleteOwnMessage(message)">Verwijder</button>
          </div>
          <p v-if="message.body">
            <template v-for="part in linkParts(message.body)" :key="part.key">
              <a v-if="part.url" :href="part.text" target="_blank" rel="noopener noreferrer">{{ part.text }}</a>
              <template v-else>{{ part.text }}</template>
            </template>
          </p>
          <a
            v-if="message.attachmentUrl"
            class="chat-attachment"
            :href="message.attachmentUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img v-if="isImage(message)" :src="message.attachmentUrl" :alt="message.attachmentName || 'Bijlage'" />
            <span v-else>{{ message.attachmentName || 'Bijlage openen' }}</span>
          </a>
        </div>
      </div>

      <form class="chat-form" @submit.prevent="sendMessage">
        <input ref="fileInput" type="file" class="file-input" @change="onFileChange" />
        <button class="attach-btn" type="button" :disabled="sending" aria-label="Bijlage toevoegen" @click="fileInput?.click()">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 12.5 5.8-5.8a3 3 0 0 1 4.2 4.2l-7.1 7.1a5 5 0 0 1-7.1-7.1l7.4-7.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <input
          v-model="body"
          class="input"
          maxlength="2000"
          placeholder="Typ je bericht..."
          :disabled="sending"
        />
        <button class="btn btn-primary" type="submit" :disabled="sending || (!body.trim() && !attachment)">Stuur</button>
      </form>
      <div v-if="attachment" class="selected-file">
        <span>{{ attachment.attachmentName }}</span>
        <button type="button" @click="attachment = null">Verwijder</button>
      </div>
      <p v-if="error" class="chat-error">{{ error }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useSiteStore } from '../../stores/site'
import { connectSocket } from '../../composables/socket'
import { api } from '../../composables/api'

const site = useSiteStore()
const open = ref(false)
const connected = ref(false)
const sending = ref(false)
const error = ref('')
const body = ref('')
const messages = ref([])
const session = ref(null)
const unread = ref(0)
const messagesEl = ref(null)
const fileInput = ref(null)
const attachment = ref(null)
let socket = null

const chatAvailable = computed(() => Boolean(site.settings?.chatEnabled))
const welcome = computed(() => site.settings?.chatWelcome || '')

function visitorId() {
  const key = 'td-chat-visitor'
  let id = localStorage.getItem(key)
  if (!id) {
    id = `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`
    localStorage.setItem(key, id)
  }
  return id
}

function emitAck(event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (response) => {
      if (response?.ok) resolve(response)
      else reject(new Error(response?.message || 'Chat actie mislukt.'))
    })
  })
}

async function joinChat() {
  if (!chatAvailable.value) return
  socket = socket || connectSocket()
  connected.value = socket.connected
  const response = await emitAck('chat:visitor:join', { visitorId: visitorId() })
  session.value = response.session
  messages.value = response.messages || []
  markRead()
  scrollDown()
}

async function openChat() {
  open.value = true
  unread.value = 0
  try {
    await joinChat()
  } catch (e) {
    error.value = e.message
  }
}

async function sendMessage() {
  if (!body.value.trim() && !attachment.value) return
  sending.value = true
  error.value = ''
  try {
    await joinChat()
    await emitAck('chat:visitor:message', {
      visitorId: visitorId(),
      sessionId: session.value?.id,
      body: body.value,
      ...(attachment.value || {}),
    })
    body.value = ''
    attachment.value = null
    if (fileInput.value) fileInput.value.value = ''
  } catch (e) {
    error.value = e.message
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
  error.value = ''
  try {
    const dataUrl = await readFile(file)
    attachment.value = await api.post('/api/chat/upload', { fileName: file.name, dataUrl })
  } catch (e) {
    error.value = e.message
    event.target.value = ''
  } finally {
    sending.value = false
  }
}

function isImage(message) {
  return String(message.attachmentType || '').startsWith('image/')
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

function onMessage(message) {
  if (!session.value || Number(message.sessionId) !== Number(session.value.id)) return
  if (!messages.value.some((m) => m.id === message.id)) messages.value.push(message)
  if (open.value) markRead()
  else if (message.role === 'admin') unread.value += 1
  scrollDown()
}

function onMessageUpdated(message) {
  if (!session.value || Number(message.sessionId) !== Number(session.value.id)) return
  messages.value = messages.value.map((item) => item.id === message.id ? message : item)
}

function onMessageDeleted({ id, sessionId } = {}) {
  if (!session.value || Number(sessionId) !== Number(session.value.id)) return
  messages.value = messages.value.filter((item) => item.id !== id)
}

function onChatDeleted({ sessionId } = {}) {
  if (!session.value || Number(sessionId) !== Number(session.value.id)) return
  session.value = null
  messages.value = []
  unread.value = 0
  open.value = false
}

async function editOwnMessage(message) {
  const next = window.prompt('Bericht wijzigen', message.body || '')
  if (next === null) return
  try {
    await emitAck('chat:visitor:edit', {
      visitorId: visitorId(),
      messageId: message.id,
      body: next,
    })
  } catch (e) {
    error.value = e.message
  }
}

async function deleteOwnMessage(message) {
  if (!window.confirm('Dit bericht verwijderen?')) return
  try {
    await emitAck('chat:visitor:delete', {
      visitorId: visitorId(),
      messageId: message.id,
    })
  } catch (e) {
    error.value = e.message
  }
}

function markRead() {
  if (session.value?.id) socket?.emit('chat:visitor:read', { sessionId: session.value.id })
}

function scrollDown() {
  nextTick(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  })
}

watch(chatAvailable, async (enabled) => {
  if (enabled && open.value) await joinChat().catch((e) => { error.value = e.message })
  if (!enabled) open.value = false
})

onMounted(() => {
  socket = connectSocket()
  connected.value = socket.connected
  socket.on('connect', () => { connected.value = true })
  socket.on('disconnect', () => { connected.value = false })
  socket.on('chat:message', onMessage)
  socket.on('chat:message:updated', onMessageUpdated)
  socket.on('chat:message:deleted', onMessageDeleted)
  socket.on('chat:deleted', onChatDeleted)
  window.addEventListener('td:open-chat', openChat)
})

onBeforeUnmount(() => {
  if (!socket) return
  socket.off('connect')
  socket.off('disconnect')
  socket.off('chat:message', onMessage)
  socket.off('chat:message:updated', onMessageUpdated)
  socket.off('chat:message:deleted', onMessageDeleted)
  socket.off('chat:deleted', onChatDeleted)
  window.removeEventListener('td:open-chat', openChat)
})
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 22px;
  bottom: 22px;
  z-index: 30;
}
.chat-launch {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 48px;
  padding: 0 18px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--accent);
  color: var(--text-inverse);
  font-weight: 800;
  box-shadow: var(--shadow);
}
.chat-launch svg {
  width: 21px;
  height: 21px;
}
.chat-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--success) 24%, transparent);
}
.chat-count {
  min-width: 20px;
  height: 20px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: var(--danger);
  font-size: 0.75rem;
}
.chat-panel {
  width: min(380px, calc(100vw - 28px));
  height: min(560px, calc(100vh - 48px));
  display: grid;
  grid-template-rows: auto 1fr auto auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 96%, transparent);
  box-shadow: var(--shadow);
  overflow: hidden;
}
.chat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--surface);
}
.chat-head div {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.chat-head span {
  color: var(--muted);
  font-size: 0.78rem;
}
.chat-head button {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field-bg);
  color: var(--text);
}
.chat-messages {
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chat-system {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--info-border);
  border-radius: var(--radius);
  background: var(--info-bg);
  font-size: 0.9rem;
}
.chat-message {
  max-width: 82%;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.chat-message span {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 700;
}
.message-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.message-actions button {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0;
}
.message-actions button:hover {
  color: var(--accent);
}
.chat-message p,
.chat-attachment {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field-bg);
  color: var(--text);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.chat-message p a {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.chat-attachment {
  display: block;
  padding: 8px;
  text-decoration: none;
}
.chat-attachment img {
  max-width: 210px;
  max-height: 160px;
  border-radius: 6px;
  object-fit: cover;
}
.chat-attachment span {
  color: var(--accent);
}
.chat-message.visitor {
  align-self: flex-end;
  align-items: flex-end;
}
.chat-message.visitor p,
.chat-message.visitor .chat-attachment {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--text-inverse);
}
.chat-form {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid var(--border);
}
.file-input {
  display: none;
}
.attach-btn {
  width: 42px;
  min-height: 42px;
  display: inline-grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field-bg);
  color: var(--text);
}
.attach-btn svg {
  width: 20px;
  height: 20px;
}
.chat-form .btn {
  min-height: 42px;
  padding-inline: 14px;
}
.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 0 12px 10px;
  color: var(--muted);
  font-size: 0.82rem;
}
.selected-file button {
  border: 0;
  background: transparent;
  color: var(--danger);
  font-weight: 800;
}
.chat-error {
  margin: 0;
  padding: 0 12px 12px;
  color: var(--danger);
  font-size: 0.85rem;
}
@media (max-width: 520px) {
  .chat-widget {
    right: 12px;
    bottom: 78px;
  }
  .chat-widget:not(.open) {
    display: none;
  }
  .chat-panel {
    width: calc(100vw - 24px);
    height: min(560px, calc(100vh - 96px));
  }
}
</style>
