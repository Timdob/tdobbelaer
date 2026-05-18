<template>
  <div class="invoice-admin">
    <header class="head">
      <div>
        <h1>Facturen</h1>
        <p class="muted">Financieel overzicht, openstaande betalingen, vervallen facturen en handmatige mails.</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost" type="button" @click="exportCsv">CSV export</button>
        <button class="btn btn-primary" type="button" :disabled="loading" @click="load">{{ loading ? 'Laden...' : 'Vernieuwen' }}</button>
      </div>
    </header>

    <section class="stats">
      <article class="stat danger">
        <span>Openstaand</span>
        <strong>€ {{ formatPrice(summary.totalOutstanding) }}</strong>
        <small>{{ summary.openCount || 0 }} open facturen</small>
      </article>
      <article class="stat warning">
        <span>Vervallen</span>
        <strong>€ {{ formatPrice(summary.overdueOutstanding) }}</strong>
        <small>{{ summary.overdueCount || 0 }} over datum</small>
      </article>
      <article class="stat success">
        <span>Betaald deze maand</span>
        <strong>€ {{ formatPrice(summary.paidThisMonth) }}</strong>
        <small>Ontvangen betalingen</small>
      </article>
      <article class="stat">
        <span>Omzet dit jaar</span>
        <strong>€ {{ formatPrice(summary.revenueThisYear) }}</strong>
        <small>Op betaaldatum</small>
      </article>
      <article class="stat">
        <span>BTW openstaand</span>
        <strong>€ {{ formatPrice(summary.vatOutstanding) }}</strong>
        <small>Indicatief btw-deel</small>
      </article>
    </section>

    <section class="filters">
      <input v-model="filters.search" class="input" placeholder="Zoek klant, nummer, titel..." />
      <select v-model="filters.status" class="select">
        <option value="">Alle statussen</option>
        <option v-for="status in statuses" :key="status.value" :value="status.value">{{ status.label }}</option>
      </select>
      <select v-model="filters.bucket" class="select">
        <option value="">Alle betalingen</option>
        <option value="open">Openstaand</option>
        <option value="overdue">Vervallen</option>
        <option value="paid">Betaald</option>
        <option value="partial">Deels betaald</option>
      </select>
      <input v-model="filters.from" type="date" class="input" />
      <input v-model="filters.to" type="date" class="input" />
    </section>

    <section class="quick-lists">
      <article>
        <div class="section-title">
          <h2>Openstaande betalingen</h2>
          <span class="muted small">{{ openInvoices.length }} facturen</span>
        </div>
        <div class="mini-list">
          <button v-for="inv in openInvoices.slice(0, 6)" :key="inv.id" type="button" @click="selectInvoice(inv)">
            <span>
              <strong>{{ inv.customerName }}</strong>
              <small>{{ inv.invoiceNumber || `#${inv.id}` }} · {{ daysLabel(inv) }}</small>
            </span>
            <b>€ {{ formatPrice(remaining(inv)) }}</b>
          </button>
          <p v-if="!openInvoices.length" class="muted small">Geen openstaande facturen.</p>
        </div>
      </article>

      <article>
        <div class="section-title">
          <h2>Vervallen</h2>
          <span class="muted small">{{ overdueInvoices.length }} facturen</span>
        </div>
        <div class="mini-list">
          <button v-for="inv in overdueInvoices.slice(0, 6)" :key="inv.id" type="button" @click="selectInvoice(inv)">
            <span>
              <strong>{{ inv.customerName }}</strong>
              <small>Vervaldatum {{ formatDate(inv.dueDate) }}</small>
            </span>
            <b>€ {{ formatPrice(remaining(inv)) }}</b>
          </button>
          <p v-if="!overdueInvoices.length" class="muted small">Geen vervallen facturen.</p>
        </div>
      </article>
    </section>

    <section class="table-wrap">
      <div class="section-title">
        <h2>Alle facturen</h2>
        <span class="muted small">{{ filteredInvoices.length }} resultaten</span>
      </div>

      <div class="invoice-table">
        <div class="thead">
          <span>Factuur</span><span>Klant</span><span>Status</span><span>Vervalt</span><span>Totaal</span><span>Rest</span><span>Acties</span>
        </div>
        <div v-for="inv in filteredInvoices" :key="inv.id" class="tr" :class="{ selected: selected?.id === inv.id }">
          <span>
            <strong>{{ inv.invoiceNumber || `#${inv.id}` }}</strong>
            <small>{{ inv.title }}</small>
          </span>
          <span>
            <strong>{{ inv.customerName }}</strong>
            <small>{{ inv.customerEmail }}</small>
          </span>
          <span><span class="tag" :class="`inv-${inv.status}`">{{ statusLabel(inv.status) }}</span></span>
          <span :class="{ overdue: isOverdue(inv) }">{{ formatDate(inv.dueDate) || '-' }}</span>
          <span>€ {{ formatPrice(inv.total) }}</span>
          <span>€ {{ formatPrice(remaining(inv)) }}</span>
          <span class="actions">
            <button class="btn btn-ghost" type="button" @click="selectInvoice(inv)">Details</button>
            <button class="btn btn-ghost" type="button" @click="openMail(inv)">Mail</button>
            <a class="btn btn-ghost" :href="`/api/invoices/${inv.id}/pdf?token=${auth.token}`" target="_blank" rel="noopener">PDF</a>
          </span>
        </div>
        <p v-if="!filteredInvoices.length" class="muted empty">Geen facturen gevonden.</p>
      </div>
    </section>

    <aside v-if="selected" class="detail">
      <div class="detail-head">
        <div>
          <span class="eyebrow">Factuurdetails</span>
          <h2>{{ selected.invoiceNumber || `#${selected.id}` }}</h2>
        </div>
        <button class="btn btn-ghost" type="button" @click="selected = null">Sluiten</button>
      </div>

      <div class="detail-grid">
        <div><span>Klant</span><strong>{{ selected.customerName }}</strong></div>
        <div><span>Totaal</span><strong>€ {{ formatPrice(selected.total) }}</strong></div>
        <div><span>Betaald</span><strong>€ {{ formatPrice(selected.paidAmount) }}</strong></div>
        <div><span>Restbedrag</span><strong>€ {{ formatPrice(remaining(selected)) }}</strong></div>
        <div><span>Factuurdatum</span><strong>{{ formatDate(selected.issueDate) || '-' }}</strong></div>
        <div><span>Vervaldatum</span><strong>{{ formatDate(selected.dueDate) || '-' }}</strong></div>
      </div>

      <div class="payment-box">
        <h3>Betaling bijwerken</h3>
        <div class="grid grid-2">
          <div>
            <label class="label">Status</label>
            <select v-model="paymentForm.status" class="select">
              <option v-for="status in statuses" :key="status.value" :value="status.value">{{ status.label }}</option>
            </select>
          </div>
          <div>
            <label class="label">Ontvangen bedrag</label>
            <input v-model.number="paymentForm.paidAmount" type="number" min="0" step="0.01" class="input" />
          </div>
          <div>
            <label class="label">Betaaldatum</label>
            <input v-model="paymentForm.paidAt" type="datetime-local" class="input" />
          </div>
          <div>
            <label class="label">Betaalmethode</label>
            <input v-model="paymentForm.paymentMethod" class="input" placeholder="Bank, iDEAL, contant..." />
          </div>
        </div>
        <label class="label mt">Referentie</label>
        <input v-model="paymentForm.paymentReference" class="input" placeholder="Transactie-ID of omschrijving" />
        <p v-if="paymentError" class="error">{{ paymentError }}</p>
        <div class="detail-actions">
          <button class="btn btn-primary" type="button" :disabled="savingPayment" @click="savePayment">
            {{ savingPayment ? 'Opslaan...' : 'Betaling opslaan' }}
          </button>
          <button class="btn btn-ghost" type="button" @click="markPaid">Markeer betaald</button>
          <button class="btn btn-ghost" type="button" @click="openMail(selected)">Mail sturen</button>
        </div>
      </div>
    </aside>

    <div v-if="mailInvoice" class="modal-backdrop" @click.self="mailInvoice = null">
      <form class="mail-modal" @submit.prevent="sendMail">
        <h2>Mail sturen</h2>
        <p class="muted small">{{ mailInvoice.customerName }} · {{ mailInvoice.invoiceNumber || `#${mailInvoice.id}` }}</p>
        <label class="label">Aan</label>
        <input v-model="mailForm.to" class="input" />
        <label class="label mt">Onderwerp</label>
        <input v-model="mailForm.subject" class="input" />
        <label class="label mt">Bericht</label>
        <textarea v-model="mailForm.body" class="textarea" rows="8"></textarea>
        <label class="check"><input v-model="mailForm.markSent" type="checkbox" /> Markeer als verstuurd</label>
        <p v-if="mailError" class="error">{{ mailError }}</p>
        <div class="detail-actions">
          <button class="btn btn-ghost" type="button" @click="mailInvoice = null">Annuleren</button>
          <button class="btn btn-primary" type="submit" :disabled="mailSending">{{ mailSending ? 'Versturen...' : 'Verstuur mail' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '../../composables/api'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const loading = ref(false)
const invoices = ref([])
const summary = ref({})
const selected = ref(null)
const paymentError = ref('')
const savingPayment = ref(false)
const mailInvoice = ref(null)
const mailError = ref('')
const mailSending = ref(false)

const statuses = [
  { value: 'concept', label: 'Concept' },
  { value: 'verstuurd', label: 'Verstuurd' },
  { value: 'open', label: 'Open' },
  { value: 'deels_betaald', label: 'Deels betaald' },
  { value: 'betaald', label: 'Betaald' },
  { value: 'vervallen', label: 'Vervallen' },
  { value: 'geannuleerd', label: 'Geannuleerd' },
]

const filters = reactive({ search: '', status: '', bucket: '', from: '', to: '' })
const paymentForm = reactive({ status: 'open', paidAmount: 0, paidAt: '', paymentMethod: '', paymentReference: '' })
const mailForm = reactive({ to: '', subject: '', body: '', markSent: true })

onMounted(load)

async function load() {
  loading.value = true
  try {
    const r = await api.get('/api/admin/invoices')
    invoices.value = r.invoices || []
    summary.value = r.summary || {}
    if (selected.value) selected.value = invoices.value.find((i) => i.id === selected.value.id) || null
  } finally {
    loading.value = false
  }
}

const filteredInvoices = computed(() => {
  const q = filters.search.trim().toLowerCase()
  return invoices.value.filter((inv) => {
    if (q && ![inv.invoiceNumber, inv.title, inv.customerName, inv.customerEmail].some((v) => String(v || '').toLowerCase().includes(q))) return false
    if (filters.status && inv.status !== filters.status) return false
    if (filters.bucket === 'open' && !isOpen(inv)) return false
    if (filters.bucket === 'overdue' && !isOverdue(inv)) return false
    if (filters.bucket === 'paid' && inv.status !== 'betaald') return false
    if (filters.bucket === 'partial' && inv.status !== 'deels_betaald') return false
    const issue = inv.issueDate ? String(inv.issueDate).slice(0, 10) : ''
    if (filters.from && issue < filters.from) return false
    if (filters.to && issue > filters.to) return false
    return true
  })
})

const openInvoices = computed(() => invoices.value.filter(isOpen).sort((a, b) => remaining(b) - remaining(a)))
const overdueInvoices = computed(() => invoices.value.filter(isOverdue).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)))

function isOpen(inv) { return !['betaald', 'geannuleerd'].includes(inv.status) }
function isOverdue(inv) {
  if (!isOpen(inv) || !inv.dueDate) return false
  return String(inv.dueDate).slice(0, 10) < new Date().toISOString().slice(0, 10)
}
function remaining(inv) { return Math.max(Number(inv.total || 0) - Number(inv.paidAmount || 0), 0) }
function statusLabel(status) { return statuses.find((s) => s.value === status)?.label || status }
function formatPrice(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0) }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('nl-NL') : '' }
function daysLabel(inv) {
  if (!inv.dueDate) return 'geen vervaldatum'
  const diff = Math.ceil((new Date(inv.dueDate) - new Date()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)} dagen te laat`
  if (diff === 0) return 'vervalt vandaag'
  return `vervalt over ${diff} dagen`
}
function toLocalInput(value) {
  if (!value) return ''
  const date = new Date(value)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}

function selectInvoice(inv) {
  selected.value = inv
  paymentError.value = ''
  Object.assign(paymentForm, {
    status: inv.status || 'open',
    paidAmount: Number(inv.paidAmount || 0),
    paidAt: toLocalInput(inv.paidAt),
    paymentMethod: inv.paymentMethod || '',
    paymentReference: inv.paymentReference || '',
  })
}

function markPaid() {
  paymentForm.status = 'betaald'
  paymentForm.paidAmount = Number(selected.value?.total || 0)
  paymentForm.paidAt = toLocalInput(new Date().toISOString())
}

async function savePayment() {
  if (!selected.value) return
  savingPayment.value = true
  paymentError.value = ''
  try {
    const updated = await api.patch(`/api/admin/invoices/${selected.value.id}/payment`, {
      ...paymentForm,
      paidAt: paymentForm.paidAt || null,
    })
    invoices.value = invoices.value.map((i) => i.id === updated.id ? { ...i, ...updated } : i)
    selectInvoice({ ...selected.value, ...updated })
    await load()
  } catch (e) {
    paymentError.value = e.message
  } finally {
    savingPayment.value = false
  }
}

function openMail(inv) {
  mailInvoice.value = inv
  mailError.value = ''
  Object.assign(mailForm, {
    to: inv.customerEmail || '',
    subject: `Factuur ${inv.invoiceNumber || inv.id}`,
    body: `Hallo ${inv.customerName || ''},\n\nHierbij een bericht over factuur ${inv.invoiceNumber || inv.id}.\n\nTotaal: € ${formatPrice(inv.total)}\nOpenstaand: € ${formatPrice(remaining(inv))}\n\nMet vriendelijke groet,\nTD Development`,
    markSent: true,
  })
}

async function sendMail() {
  mailSending.value = true
  mailError.value = ''
  try {
    await api.post(`/api/admin/invoices/${mailInvoice.value.id}/send-mail`, mailForm)
    mailInvoice.value = null
    await load()
  } catch (e) {
    mailError.value = e.message
  } finally {
    mailSending.value = false
  }
}

function exportCsv() {
  const headers = ['Factuurnummer', 'Klant', 'Email', 'Status', 'Factuurdatum', 'Vervaldatum', 'Totaal', 'Betaald', 'Restbedrag']
  const rows = filteredInvoices.value.map((i) => [
    i.invoiceNumber || `#${i.id}`, i.customerName, i.customerEmail, statusLabel(i.status),
    formatDate(i.issueDate), formatDate(i.dueDate), i.total, i.paidAmount, remaining(i),
  ])
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `facturen-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 18px; margin-bottom: 22px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.head-actions { display: flex; gap: 8px; }
.stats { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
.stat { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.stat span, .stat small { display: block; color: var(--muted); font-size: 0.78rem; }
.stat strong { display: block; margin: 6px 0 2px; font-size: 1.25rem; font-family: var(--font-display); }
.stat.danger strong { color: var(--danger); }
.stat.warning strong { color: var(--warning); }
.stat.success strong { color: var(--success); }
.filters { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 18px; }
.quick-lists { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
.quick-lists article, .table-wrap, .detail, .payment-box { border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); padding: 16px; }
.section-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.section-title h2 { margin: 0; font-size: 1.05rem; }
.mini-list { display: grid; gap: 8px; }
.mini-list button { display: flex; justify-content: space-between; gap: 12px; padding: 10px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--field-bg); text-align: left; }
.mini-list small, .tr small { display: block; color: var(--muted); font-size: 0.75rem; }
.invoice-table { overflow-x: auto; }
.thead, .tr { display: grid; grid-template-columns: 1.2fr 1.4fr 0.9fr 0.8fr 0.8fr 0.8fr 1.6fr; gap: 10px; align-items: center; min-width: 980px; }
.thead { padding: 0 10px 8px; color: var(--muted); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; }
.tr { padding: 10px; border-top: 1px solid var(--border); }
.tr.selected { background: var(--accent-dim); }
.actions, .detail-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.actions .btn { min-height: 34px; padding: 7px 10px; font-size: 0.78rem; }
.overdue { color: var(--danger); font-weight: 800; }
.tag.inv-concept { color: var(--muted); background: var(--field-bg); }
.tag.inv-verstuurd, .tag.inv-open { color: var(--warning); background: var(--warning-bg); border-color: var(--warning-border); }
.tag.inv-deels_betaald { color: var(--accent-2); background: var(--info-bg); border-color: var(--info-border); }
.tag.inv-betaald { color: var(--success); background: var(--success-bg); border-color: var(--success-border); }
.tag.inv-vervallen { color: var(--danger); background: var(--danger-bg); border-color: var(--danger-border); }
.tag.inv-geannuleerd { color: var(--muted); }
.detail { margin-top: 18px; }
.detail-head { display: flex; justify-content: space-between; gap: 14px; margin-bottom: 14px; }
.detail-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-bottom: 14px; }
.detail-grid div { padding: 12px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--field-bg); }
.detail-grid span { display: block; color: var(--muted); font-size: 0.75rem; }
.mt { margin-top: 12px; }
.error { color: var(--danger); }
.empty { padding: 20px 10px 0; }
.modal-backdrop { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 20px; background: color-mix(in srgb, var(--text) 42%, transparent); }
.mail-modal { width: min(640px, 100%); max-height: calc(100vh - 40px); overflow: auto; padding: 22px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); box-shadow: var(--shadow); }
.check { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 0.9rem; }
@media (max-width: 1050px) {
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filters, .quick-lists, .detail-grid { grid-template-columns: 1fr; }
  .head { align-items: stretch; flex-direction: column; }
}
</style>
