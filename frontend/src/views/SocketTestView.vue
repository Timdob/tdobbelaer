<template>
  <section class="socket-test section">
    <div class="container">
      <div class="head">
        <span class="eyebrow">Realtime test</span>
        <h1>Socket.IO status</h1>
        <p class="muted lead">Controleer of live updates vanuit de server binnenkomen.</p>
      </div>

      <div class="grid grid-2">
        <article class="card status-card">
          <div class="status-row">
            <span class="label">Status</span>
            <strong :class="connected ? 'ok' : 'bad'">{{ connected ? 'Verbonden' : 'Niet verbonden' }}</strong>
          </div>
          <div class="status-row">
            <span class="label">Socket ID</span>
            <code>{{ socketId || '-' }}</code>
          </div>
          <div class="status-row">
            <span class="label">Transport</span>
            <code>{{ transport || '-' }}</code>
          </div>

          <div class="actions">
            <button class="btn btn-primary" type="button" @click="triggerSiteUpdate" :disabled="busy || !auth.isAdmin">
              {{ busy ? 'Versturen...' : 'Trigger site:updated' }}
            </button>
            <button class="btn btn-ghost" type="button" @click="clearLog">Log wissen</button>
          </div>
          <p v-if="!auth.isAdmin" class="muted small">Log in als admin om een test-event te versturen.</p>
          <p v-if="message" class="message">{{ message }}</p>
        </article>

        <article class="card">
          <h2>Ontvangen events</h2>
          <div class="events">
            <div v-for="item in events" :key="item.id" class="event">
              <span>{{ item.time }}</span>
              <strong>{{ item.name }}</strong>
              <small>{{ item.detail }}</small>
            </div>
            <p v-if="!events.length" class="muted">Nog geen events ontvangen.</p>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { connectSocket } from '../composables/socket'
import { api } from '../composables/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const connected = ref(false)
const socketId = ref('')
const transport = ref('')
const events = ref([])
const busy = ref(false)
const message = ref('')
let socket = null
let nextId = 1

function addEvent(name, detail = '') {
  events.value.unshift({
    id: nextId++,
    name,
    detail,
    time: new Date().toLocaleTimeString('nl-NL'),
  })
}

function updateConnection() {
  connected.value = Boolean(socket?.connected)
  socketId.value = socket?.id || ''
  transport.value = socket?.io?.engine?.transport?.name || ''
}

async function triggerSiteUpdate() {
  busy.value = true
  message.value = ''
  try {
    const adminData = await api.get('/api/admin/data')
    const slide = adminData.heroSlides?.[0]
    if (!slide) throw new Error('Geen hero slide gevonden om te testen.')
    await api.put(`/api/admin/hero-slides/${slide.id}`, slide)
    message.value = 'Test-event verstuurd. Kijk of site:updated in de log verschijnt.'
  } catch (e) {
    message.value = e.message
  } finally {
    busy.value = false
  }
}

function clearLog() {
  events.value = []
}

onMounted(() => {
  socket = connectSocket()
  updateConnection()

  socket.on('connect', () => {
    updateConnection()
    addEvent('connect', socket.id)
  })
  socket.on('disconnect', (reason) => {
    updateConnection()
    addEvent('disconnect', reason)
  })
  socket.on('connect_error', (error) => {
    updateConnection()
    addEvent('connect_error', error.message)
  })
  socket.on('site:updated', () => addEvent('site:updated', 'Publieke site-data gewijzigd.'))
  socket.on('customer:updated', () => addEvent('customer:updated', 'Klantdata gewijzigd.'))
  socket.io.engine?.on('upgrade', () => {
    updateConnection()
    addEvent('transport:upgrade', transport.value)
  })
})

onBeforeUnmount(() => {
  if (!socket) return
  socket.off('connect')
  socket.off('disconnect')
  socket.off('connect_error')
  socket.off('site:updated')
  socket.off('customer:updated')
})
</script>

<style scoped>
.head { max-width: 720px; margin-bottom: 40px; }
.head h1 { margin-top: 14px; }
.status-card { display: flex; flex-direction: column; gap: 18px; }
.status-row {
  display: flex; justify-content: space-between; align-items: center; gap: 20px;
  border-bottom: 1px solid var(--border); padding-bottom: 14px;
}
.status-row code { color: var(--muted); word-break: break-all; }
.ok { color: var(--success); }
.bad { color: var(--danger); }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 8px; }
.message {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 12px;
  margin: 0;
}
.card h2 { font-size: 1.2rem; margin-bottom: 18px; }
.events { display: flex; flex-direction: column; gap: 10px; }
.event {
  display: grid; grid-template-columns: 78px 130px 1fr; gap: 12px;
  border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px;
}
.event span, .event small { color: var(--muted); }
@media (max-width: 700px) {
  .event { grid-template-columns: 1fr; gap: 4px; }
  .status-row { flex-direction: column; align-items: flex-start; }
}
</style>
