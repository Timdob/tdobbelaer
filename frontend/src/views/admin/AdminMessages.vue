<template>
  <div>
    <header class="head">
      <div>
        <h1>Berichten</h1>
        <p class="muted">Contactaanvragen vanaf de website.</p>
      </div>
      <button class="btn btn-ghost" @click="load">Verversen</button>
    </header>

    <div class="layout">
      <aside class="message-list">
        <button v-for="m in admin.messages" :key="m.id"
          class="message-item" :class="{ active: selected?.id === m.id, unread: m.status === 'nieuw' }"
          @click="select(m)">
          <div class="title">{{ m.subject }}</div>
          <div class="meta">
            <span>{{ m.name }}</span>
            <span>{{ formatDate(m.createdAt) }}</span>
          </div>
        </button>
        <p v-if="!admin.messages.length" class="muted small">Nog geen berichten.</p>
      </aside>

      <section v-if="selected" class="card detail">
        <div class="detail-head">
          <div>
            <span class="tag">{{ selected.status }}</span>
            <h2>{{ selected.subject }}</h2>
          </div>
          <button class="btn btn-ghost danger" @click="remove(selected.id)">Verwijderen</button>
        </div>

        <div class="info">
          <div><span class="label">Naam</span>{{ selected.name }}</div>
          <div><span class="label">E-mail</span><a :href="`mailto:${selected.email}`">{{ selected.email }}</a></div>
          <div v-if="selected.phone"><span class="label">Telefoon</span><a :href="`tel:${selected.phone}`">{{ selected.phone }}</a></div>
          <div v-if="selected.company"><span class="label">Bedrijf</span>{{ selected.company }}</div>
          <div><span class="label">Ontvangen</span>{{ formatDateTime(selected.createdAt) }}</div>
        </div>

        <div class="message-body">{{ selected.message }}</div>
        <div class="actions">
          <a class="btn btn-primary" :href="replyHref">Beantwoorden</a>
          <button v-if="selected.status === 'nieuw'" class="btn btn-ghost" @click="markRead(selected.id)">Markeer gelezen</button>
        </div>
      </section>

      <section v-else class="card empty muted">Selecteer een bericht.</section>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { connectSocket } from '../../composables/socket'

const admin = useAdminStore()
const selected = ref(null)
let socket = null

const replyHref = computed(() => {
  if (!selected.value) return '#'
  const subject = encodeURIComponent(`Re: ${selected.value.subject}`)
  return `mailto:${selected.value.email}?subject=${subject}`
})

async function load() {
  await admin.loadMessages()
  if (selected.value) selected.value = admin.messages.find((m) => m.id === selected.value.id) || null
  if (!selected.value && admin.messages.length) selected.value = admin.messages[0]
}

async function select(message) {
  selected.value = message
  if (message.status === 'nieuw') await markRead(message.id)
}

async function markRead(id) {
  const updated = await admin.markMessageRead(id)
  selected.value = updated
}

async function remove(id) {
  if (!confirm('Bericht verwijderen?')) return
  await admin.deleteMessage(id)
  selected.value = admin.messages[0] || null
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })
}

function formatDateTime(value) {
  return new Date(value).toLocaleString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

onMounted(async () => {
  await load()
  socket = connectSocket()
  socket.on('messages:updated', load)
})

onBeforeUnmount(() => {
  if (socket) socket.off('messages:updated', load)
})
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 20px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.layout { display: grid; grid-template-columns: 330px 1fr; gap: 24px; align-items: start; }
.message-list {
  display: flex; flex-direction: column; gap: 6px; padding: 14px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg);
}
.message-item {
  display: flex; flex-direction: column; gap: 5px; text-align: left;
  padding: 12px; border-radius: 10px; background: transparent;
  border: 1px solid transparent; color: var(--text); cursor: pointer;
}
.message-item:hover { background: var(--surface-hover); }
.message-item.active { border-color: var(--border-strong); background: var(--accent-dim); }
.message-item.unread .title { color: var(--accent-2); }
.title { font-weight: 700; }
.meta { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: 0.82rem; }
.detail { padding: 28px; }
.detail-head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
.detail h2 { margin: 10px 0 0; font-size: 1.45rem; }
.info {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px; margin: 26px 0;
}
.info .label { display: block; margin-bottom: 4px; }
.info a { color: var(--accent-2); }
.message-body {
  white-space: pre-wrap; line-height: 1.75;
  border: 1px solid var(--border); border-radius: var(--radius);
  padding: 18px; background: var(--field-bg);
}
.actions { display: flex; gap: 10px; margin-top: 18px; }
.danger { color: var(--danger); border-color: var(--danger-border); }
.danger:hover { background: var(--danger-bg); }
.empty { padding: 60px; text-align: center; }
@media (max-width: 900px) {
  .layout, .info { grid-template-columns: 1fr; }
}
</style>
