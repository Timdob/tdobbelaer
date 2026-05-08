<template>
  <section class="portal section">
    <div class="container">
      <span class="eyebrow">Klantportaal</span>
      <h1>Hoi {{ customer?.contactName || customer?.company }}</h1>
      <p class="muted lead">Hier zie je je actieve diensten en facturatie.</p>

      <div v-if="loading" class="muted">Laden...</div>

      <div v-else-if="customer" class="grid grid-2">
        <div class="card">
          <h3>Bedrijf</h3>
          <div class="info">
            <div><span class="label">Bedrijf</span> {{ customer.company }}</div>
            <div><span class="label">Contact</span> {{ customer.contactName }}</div>
            <div><span class="label">Email</span> {{ customer.email }}</div>
            <div v-if="customer.phone"><span class="label">Telefoon</span> {{ customer.phone }}</div>
            <div v-if="customer.website"><span class="label">Website</span> {{ customer.website }}</div>
            <div><span class="label">Status</span> <span class="tag">{{ customer.status }}</span></div>
          </div>
        </div>

        <div class="card">
          <h3>Facturatie</h3>
          <div class="info">
            <div><span class="label">Maandbedrag</span> €{{ formatPrice(customer.monthlyTotal) }}</div>
            <div v-if="customer.nextInvoice"><span class="label">Volgende factuur</span> {{ formatDate(customer.nextInvoice) }}</div>
          </div>
        </div>
      </div>

      <h2 class="services-title">Actieve diensten</h2>
      <div class="services">
        <div v-for="s in customer?.services || []" :key="s.id" class="service card">
          <div>
            <h3>{{ s.name }}</h3>
            <span class="tag">{{ s.status }}</span>
          </div>
          <div class="price">€{{ formatPrice(s.price) }}<span class="muted small"> / {{ s.period }}</span></div>
        </div>
        <div v-if="!customer?.services?.length" class="muted">Nog geen diensten ingesteld.</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onBeforeUnmount, onMounted } from 'vue'
import { api } from '../composables/api'
import { connectSocket } from '../composables/socket'

const customer = ref(null)
const loading = ref(true)
let socket = null

async function loadCustomer() {
  try {
    const r = await api.get('/api/client/me')
    customer.value = r.customer
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadCustomer()
  socket = connectSocket()
  socket.on('customer:updated', loadCustomer)
})

onBeforeUnmount(() => {
  if (socket) socket.off('customer:updated', loadCustomer)
})

function formatPrice(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2 }).format(n || 0) }
function formatDate(d) { return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) }
</script>

<style scoped>
.portal { padding-top: 80px; }
.info { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }
.info .label { display: block; font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 4px; }
.services-title { margin-top: 50px; }
.services { display: grid; gap: 14px; }
.service { display: flex; align-items: center; justify-content: space-between; padding: 22px 26px; }
.service h3 { margin: 0 0 6px; font-size: 1rem; }
.price { font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; }
</style>
