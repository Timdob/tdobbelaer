<template>
  <section class="portal section">
    <div class="container">
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p class="muted">Laden...</p>
      </div>

      <template v-else-if="customer">
        <div class="portal-header">
          <div>
            <span class="eyebrow">Klantportaal</span>
            <h1>Hoi {{ customer.contactName || customer.company }} </h1>
          </div>
          <div class="header-meta">
            <span class="tag status-tag">{{ customer.status || 'Actief' }}</span>
          </div>
        </div>

        <!-- Tabs -->
        <nav class="tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
            <span v-if="tab.id === 'invoices' && openInvoiceCount" class="tab-badge">{{ openInvoiceCount }}</span>
          </button>
        </nav>

        <div class="portal-body">
        <div class="portal-main">

        <!-- Tijdlijn -->
        <div v-if="activeTab === 'timeline'" class="tab-content">
          <div v-if="phases.length">
            <!-- Progress header -->
            <div class="progress-header">
              <div class="progress-meta">
                <div class="progress-stat">
                  <span class="progress-stat-value">{{ doneCount }}</span>
                  <span class="progress-stat-label">Afgerond</span>
                </div>
                <div class="progress-divider"></div>
                <div class="progress-stat">
                  <span class="progress-stat-value">{{ phases.length }}</span>
                  <span class="progress-stat-label">Totaal</span>
                </div>
                <div class="progress-divider"></div>
                <div class="progress-stat">
                  <span class="progress-stat-value accent">{{ progressPct }}%</span>
                  <span class="progress-stat-label">Voltooid</span>
                </div>
              </div>
              <div class="progress-bar-wrap">
                <div class="progress-bar-track">
                  <div class="progress-bar-fill" :style="{ width: progressPct + '%' }"></div>
                  <div class="progress-bar-glow" :style="{ width: progressPct + '%' }"></div>
                </div>
                <span class="progress-pct-label">{{ progressPct }}%</span>
              </div>
            </div>

            <!-- Timeline -->
            <div class="timeline">
              <div
                v-for="(phase, i) in phases"
                :key="phase.id"
                class="phase-card"
                :class="phase.status"
              >
                <!-- Left: step indicator -->
                <div class="phase-step">
                  <div class="phase-line top" :class="{ lit: i > 0 && phases[i-1]?.status === 'done' || phase.status === 'done' }"></div>
                  <div class="phase-dot">
                    <svg v-if="phase.status === 'done'" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M5 13l4 4L19 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <template v-else-if="phase.status === 'active'">
                      <div class="pulse-ring"></div>
                      <div class="pulse-dot"></div>
                    </template>
                    <span v-else class="phase-num">{{ i + 1 }}</span>
                  </div>
                  <div class="phase-line bottom" :class="{ lit: phase.status === 'done' }" v-if="i < phases.length - 1"></div>
                </div>

                <!-- Right: content -->
                <div class="phase-content">
                  <div class="phase-content-inner">
                    <div class="phase-header">
                      <div class="phase-title-row">
                        <h3 class="phase-name">{{ phase.name }}</h3>
                        <span class="phase-badge" :class="phase.status">
                          <span v-if="phase.status === 'done'">Afgerond</span>
                          <span v-else-if="phase.status === 'active'">Actief</span>
                          <span v-else>Gepland</span>
                        </span>
                      </div>
                      <p v-if="phase.description" class="phase-desc">{{ phase.description }}</p>
                    </div>
                    <div class="phase-footer" v-if="phase.completedAt || phase.status === 'active'">
                      <div v-if="phase.status === 'done' && phase.completedAt" class="phase-date">
                        <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        Afgerond op {{ formatDate(phase.completedAt) }}
                      </div>
                      <div v-else-if="phase.status === 'active'" class="phase-active-indicator">
                        <span class="active-dot"></span>
                        We werken hier momenteel aan
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-tab">
            <p class="muted">Nog geen projectfases ingesteld.</p>
          </div>
        </div>

        <!-- Bestanden -->
        <div v-if="activeTab === 'files'" class="tab-content">
          <div class="files-header">
            <p class="muted small">Upload bestanden zoals briefings, logo's of content. Max. 10 MB per bestand.</p>
            <div class="upload-area"
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @drop.prevent="onDrop"
              :class="{ dragging: dragOver }"
              @click="fileInput?.click()"
            >
              <input ref="fileInput" type="file" class="hidden-input" multiple @change="onFilePick" />
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V8m0 0-3 3m3-3 3 3M5 20h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              <span>Sleep bestanden hierheen of klik om te uploaden</span>
            </div>
            <p v-if="uploadError" class="error">{{ uploadError }}</p>
          </div>

          <div v-if="filesByCategory.length" class="files-sections">
            <div v-for="group in filesByCategory" :key="group.category" class="file-group">
              <h4>{{ group.category }}</h4>
              <div class="file-list">
                <div v-for="file in group.files" :key="file.id" class="file-row">
                  <div class="file-icon">
                    <svg v-if="isImage(file)" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16l4-4 4 4 4-6 4 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
                    <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
                  </div>
                  <div class="file-meta">
                    <a :href="file.url" target="_blank" rel="noopener">{{ file.originalName }}</a>
                    <span class="muted small">{{ formatBytes(file.sizeBytes) }} · {{ formatDate(file.createdAt) }}</span>
                  </div>
                  <button
                    v-if="file.uploadedBy === 'client'"
                    class="btn btn-ghost danger file-del"
                    type="button"
                    @click="deleteFile(file.id)"
                  >×</button>
                  <span v-else class="file-by muted small">door TD</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-tab">
            <p class="muted">Nog geen bestanden geüpload.</p>
          </div>
        </div>

        <!-- Facturen -->
        <div v-if="activeTab === 'invoices'" class="tab-content">
          <div v-if="invoices.length" class="invoices">
            <div v-for="inv in invoices" :key="inv.id" class="invoice-card">
              <div class="inv-top">
                <div>
                  <strong class="inv-num">{{ inv.invoiceNumber || `#${inv.id}` }}</strong>
                  <span class="inv-title muted">{{ inv.title }}</span>
                </div>
                <span class="tag" :class="`inv-${inv.status}`">{{ inv.status }}</span>
              </div>
              <div class="inv-info">
                <div><span class="muted small">Datum</span> {{ formatDate(inv.issueDate) }}</div>
                <div v-if="inv.dueDate"><span class="muted small">Vervaldatum</span> {{ formatDate(inv.dueDate) }}</div>
                <div><span class="muted small">Totaal</span> <strong>€ {{ formatPrice(inv.total) }}</strong></div>
              </div>
              <a class="btn btn-ghost inv-pdf" :href="`/api/invoices/${inv.id}/pdf?token=${auth.token}`" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M12 16V4m0 12-4-4m4 4 4-4M4 20h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                PDF downloaden
              </a>
            </div>
          </div>
          <div v-else class="empty-tab">
            <p class="muted">Nog geen facturen beschikbaar.</p>
          </div>
        </div>

        <!-- Diensten -->
        <div v-if="activeTab === 'services'" class="tab-content">
          <section v-if="availableServices.length" class="service-market">
            <div class="service-market-head">
              <div>
                <span class="eyebrow">Uitbreiden</span>
                <h3>Diensten toevoegen</h3>
              </div>
              <span class="muted small">{{ availableServices.length }} beschikbaar</span>
            </div>
            <div class="service-options">
              <article v-for="service in availableServices" :key="service.key" class="service-option">
                <div class="service-option-main">
                  <h4>{{ service.name }}</h4>
                  <p v-if="service.description" class="muted small">{{ service.description }}</p>
                  <div v-if="service.features?.length" class="service-features">
                    <span v-for="feature in service.features" :key="feature">{{ feature }}</span>
                  </div>
                </div>
                <div class="service-option-side">
                  <div class="price">€{{ formatPrice(service.price) }}<span class="muted small"> / {{ service.period }}</span></div>
                  <button
                    class="btn btn-primary"
                    type="button"
                    :disabled="purchasingId === service.key"
                    @click="purchaseService(service)"
                  >
                    {{ purchasingId === service.key ? 'Toevoegen...' : 'Toevoegen' }}
                  </button>
                </div>
              </article>
            </div>
          </section>

          <p v-if="purchaseMessage" class="success-msg">{{ purchaseMessage }}</p>
          <p v-if="purchaseError" class="error">{{ purchaseError }}</p>

          <div class="services">
            <div v-for="s in customer.services || []" :key="s.id" class="service-card">
              <div>
                <h3>{{ s.name }}</h3>
                <span class="tag" :class="statusClass(s.status)">{{ s.status }}</span>
              </div>
              <div class="price">€{{ formatPrice(s.price) }}<span class="muted small"> / {{ s.period }}</span></div>
            </div>
            <div v-if="!customer.services?.length" class="muted">Nog geen diensten ingesteld.</div>
          </div>
        </div>
        </div><!-- end portal-main -->

        <!-- Sidebar: website monitor -->
        <aside v-if="customer.website" class="portal-sidebar">
          <div class="sidebar-card" :class="latestCheck ? latestCheck.status : 'unknown'">
            <div class="sidebar-card-header">
              <span class="eyebrow">Website status</span>
              <span class="monitor-dot-sm" :class="latestCheck ? latestCheck.status : 'unknown'"></span>
            </div>
            <a :href="customer.website" target="_blank" rel="noopener" class="sidebar-url">{{ customer.website }}</a>

            <div v-if="latestCheck" class="sidebar-status">
              <div class="sidebar-status-row">
                <strong class="sidebar-status-label" :class="latestCheck.status">
                  <template v-if="latestCheck.status === 'up'">✓ Online</template>
                  <template v-else-if="latestCheck.status === 'warning'">⚠ Waarschuwing</template>
                  <template v-else>✕ Fout gedetecteerd</template>
                </strong>
              </div>
              <p v-if="latestCheck.error" class="sidebar-error">{{ latestCheck.error }}</p>
              <div class="sidebar-meta">
                <div class="sidebar-meta-item" v-if="latestCheck.response_ms">
                  <span class="muted small">Responstijd</span>
                  <strong>{{ latestCheck.response_ms }}ms</strong>
                </div>
                <div class="sidebar-meta-item" v-if="latestCheck.status_code">
                  <span class="muted small">HTTP status</span>
                  <strong>{{ latestCheck.status_code }}</strong>
                </div>
              </div>
              <p class="sidebar-checked-at muted small">Laatste check: {{ formatDate(latestCheck.checked_at) }}</p>
            </div>
            <p v-else class="muted small" style="margin-top:10px">Eerste check volgt binnenkort.</p>

            <div v-if="latestCheck?.status !== 'up'" class="sidebar-alert">
              <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Geef dit door aan ons zodat we het kunnen oplossen.
            </div>
          </div>
        <!-- Factuur info kaart -->
        <div class="sidebar-card sidebar-invoice-card" style="margin-top:12px">
          <span class="eyebrow" style="display:block;margin-bottom:10px">Factuuroverzicht</span>

          <div v-if="customer.nextInvoice" class="sidebar-inv-row">
            <span class="muted small">Volgende factuur</span>
            <strong>{{ formatDate(customer.nextInvoice) }}</strong>
          </div>

          <div v-if="invoices.length" class="sidebar-inv-row" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border)">
            <span class="muted small">Laatste factuur</span>
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:4px">
              <span style="font-size:0.88rem">{{ invoices[0].invoiceNumber || `#${invoices[0].id}` }}</span>
              <span class="tag" :class="`inv-${invoices[0].status}`">{{ invoices[0].status }}</span>
            </div>
            <div style="font-size:0.88rem;margin-top:2px">€ {{ formatPrice(invoices[0].total) }}</div>
          </div>

          <div v-if="openInvoiceCount" class="sidebar-alert" style="margin-top:10px">
            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ openInvoiceCount }} openstaande factuur{{ openInvoiceCount > 1 ? 'en' : '' }}
          </div>

          <p v-else-if="!invoices.length" class="muted small" style="margin-top:8px">Nog geen facturen.</p>
        </div>

        </aside>

        </div><!-- end portal-body -->

      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { api } from '../composables/api'
import { connectSocket } from '../composables/socket'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const customer = ref(null)
const loading = ref(true)
const phases = ref([])
const invoices = ref([])
const files = ref([])
const monitorChecks = ref([])
const addOnServices = ref([])
const activeTab = ref('timeline')
const dragOver = ref(false)
const uploadError = ref('')
const purchaseError = ref('')
const purchaseMessage = ref('')
const purchasingId = ref(null)
const fileInput = ref(null)
let socket = null

const tabs = [
  { id: 'timeline', label: 'Projectvoortgang' },
  { id: 'files', label: 'Bestanden' },
  { id: 'invoices', label: 'Facturen' },
  { id: 'services', label: 'Diensten' },
]

const latestCheck = computed(() => monitorChecks.value[0] || null)

const openInvoiceCount = computed(() => invoices.value.filter((i) => i.status === 'open').length)
const doneCount = computed(() => phases.value.filter((p) => p.status === 'done').length)
const progressPct = computed(() => phases.value.length ? Math.round((doneCount.value / phases.value.length) * 100) : 0)

const filesByCategory = computed(() => {
  const map = {}
  for (const f of files.value) {
    if (!map[f.category]) map[f.category] = []
    map[f.category].push(f)
  }
  return Object.entries(map).map(([category, fileList]) => ({ category, files: fileList }))
})

const availableServices = computed(() => {
  const current = new Set((customer.value?.services || []).map((s) => normalizeName(s.name)))
  return addOnServices.value.filter((service) => !current.has(normalizeName(service.name)))
})

async function loadAll() {
  try {
    const [cr, pr, ir, fr, mr, ar] = await Promise.all([
      api.get('/api/client/me'),
      api.get('/api/client/phases'),
      api.get('/api/client/invoices'),
      api.get('/api/client/files'),
      api.get('/api/client/monitor'),
      api.get('/api/client/service-addons'),
    ])
    customer.value = cr.customer
    phases.value = pr.phases
    invoices.value = ir.invoices
    files.value = fr.files
    monitorChecks.value = mr.checks
    addOnServices.value = ar.services || []
  } finally {
    loading.value = false
  }
}

async function loadMonitor() {
  const mr = await api.get('/api/client/monitor')
  monitorChecks.value = mr.checks
}

onMounted(async () => {
  await loadAll()
  socket = connectSocket()
  const join = () => socket.emit('customer:join', { token: auth.token })
  if (socket.connected) join()
  socket.on('connect', join)
  socket.on('customer:updated', loadAll)
  socket.on('monitor:updated', loadMonitor)
})
onBeforeUnmount(() => {
  if (socket) {
    socket.off('customer:updated', loadAll)
    socket.off('monitor:updated', loadMonitor)
    socket.off('connect')
  }
})

async function uploadFile(file, category = 'Algemeen') {
  uploadError.value = ''
  if (file.size > 10 * 1024 * 1024) { uploadError.value = `${file.name} is te groot (max 10 MB).`; return }
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
  const r = await api.post('/api/client/files', { fileName: file.name, dataUrl, category })
  files.value.unshift(r)
}

async function onDrop(e) {
  dragOver.value = false
  for (const file of Array.from(e.dataTransfer.files)) await uploadFile(file)
}
async function onFilePick(e) {
  for (const file of Array.from(e.target.files)) await uploadFile(file)
  if (fileInput.value) fileInput.value.value = ''
}
async function deleteFile(id) {
  if (!confirm('Bestand verwijderen?')) return
  await api.del(`/api/client/files/${id}`)
  files.value = files.value.filter((f) => f.id !== id)
}

async function purchaseService(serviceOption) {
  purchaseError.value = ''
  purchaseMessage.value = ''
  purchasingId.value = serviceOption.key
  try {
    const service = await api.post('/api/client/services', { serviceKey: serviceOption.key })
    customer.value.services = [...(customer.value.services || []), service]
    purchaseMessage.value = `${service.name} is toegevoegd aan je pakket.`
  } catch (e) {
    purchaseError.value = e.message
  } finally {
    purchasingId.value = null
  }
}

function isImage(file) { return String(file.mime).startsWith('image/') }
function normalizeName(name) {
  return String(name || '').trim().toLowerCase()
}
function statusClass(status) {
  return `status-${String(status || 'actief')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')}`
}
function formatBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}
function formatPrice(n) { return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2 }).format(n || 0) }
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<style scoped>
.portal { padding-top: 80px; padding-bottom: 80px; }

/* Portal layout */
.portal-body { display: grid; grid-template-columns: 1fr 240px; gap: 24px; align-items: start; }
.portal-main { min-width: 0; }

/* Sidebar */
.portal-sidebar { position: sticky; top: 90px; margin-top: 0; }
.sidebar-card {
  padding: 16px; border: 1px solid var(--border);
  border-radius: var(--radius-lg); background: var(--surface);
}
.sidebar-card.up { border-color: var(--success-border); }
.sidebar-card.warning { border-color: var(--warning-border); }
.sidebar-card.error { border-color: var(--danger-border); }
.sidebar-card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.sidebar-url { font-size: 0.78rem; color: var(--muted); text-decoration: none; word-break: break-all; display: block; margin-bottom: 12px; }
.sidebar-url:hover { color: var(--accent); }
.monitor-dot-sm {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; background: var(--muted);
}
.monitor-dot-sm.up { background: var(--success); box-shadow: 0 0 0 2px color-mix(in srgb, var(--success) 25%, transparent); animation: monitor-pulse 2.5s ease-in-out infinite; }
.monitor-dot-sm.warning { background: var(--warning); }
.monitor-dot-sm.error { background: var(--danger); animation: monitor-pulse 1s ease-in-out infinite; }
.monitor-dot-sm.unknown { background: var(--muted); }
@keyframes monitor-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.sidebar-status-label { font-size: 0.88rem; }
.sidebar-status-label.up { color: var(--success); }
.sidebar-status-label.warning { color: var(--warning); }
.sidebar-status-label.error { color: var(--danger); }
.sidebar-error { font-size: 0.78rem; color: var(--danger); margin: 4px 0 8px; }
.sidebar-meta { display: flex; gap: 12px; margin: 10px 0 6px; flex-wrap: wrap; }
.sidebar-meta-item { display: flex; flex-direction: column; gap: 1px; }
.sidebar-meta-item strong { font-size: 0.88rem; }
.sidebar-checked-at { display: block; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); }
.sidebar-inv-row { display: flex; flex-direction: column; gap: 2px; }
.sidebar-alert {
  display: flex; align-items: flex-start; gap: 7px; margin-top: 12px;
  padding: 10px; border-radius: var(--radius); font-size: 0.78rem; line-height: 1.4;
  background: var(--danger-bg); color: var(--danger); border: 1px solid var(--danger-border);
}
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 80px 0; }
.spinner {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid var(--border); border-top-color: var(--accent);
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.portal-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 20px; flex-wrap: wrap; margin-bottom: 32px;
}
.portal-header h1 { font-size: 2rem; margin: 4px 0 0; }
.header-meta { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 8px; }
.status-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  font-size: 0.82rem;
  font-weight: 800;
  color: var(--success);
  background: var(--success-bg);
  border-color: var(--success-border);
}
.status-tag::before {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: currentColor;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--success) 14%, transparent);
}

.tabs {
  display: flex; gap: 4px; margin-bottom: 24px;
  padding: 5px; border: 1px solid var(--border);
  border-radius: 14px; background: var(--surface);
  width: fit-content;
}
.tab {
  position: relative; padding: 9px 18px; border-radius: 10px;
  border: 0; background: transparent; color: var(--muted);
  font-weight: 600; font-size: 0.9rem; cursor: pointer; transition: all 0.15s;
}
.tab:hover { color: var(--text); }
.tab.active { background: var(--accent-dim); color: var(--text); border: 1px solid var(--border-strong); }
.tab-badge {
  position: absolute; top: 4px; right: 4px;
  min-width: 18px; height: 18px; padding: 0 5px;
  display: inline-grid; place-items: center; border-radius: 999px;
  background: var(--accent); color: var(--text-inverse); font-size: 0.65rem; font-weight: 700;
}
.tab-content { animation: fadeIn 0.15s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

/* Progress header */
.progress-header {
  display: flex; flex-direction: column; gap: 16px;
  padding: 24px 28px; margin-bottom: 32px;
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  background: radial-gradient(ellipse at 0% 0%, var(--accent-dim), transparent 60%), var(--surface);
}
.progress-meta { display: flex; align-items: center; gap: 20px; }
.progress-stat { display: flex; flex-direction: column; gap: 2px; }
.progress-stat-value { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; line-height: 1; color: var(--text); }
.progress-stat-value.accent { color: var(--accent); }
.progress-stat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.09em; color: var(--muted); }
.progress-divider { width: 1px; height: 32px; background: var(--border); }
.progress-bar-wrap { display: flex; align-items: center; gap: 12px; }
.progress-bar-track {
  position: relative; flex: 1; height: 8px;
  border-radius: 999px; background: var(--border); overflow: hidden;
}
.progress-bar-fill {
  height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), color-mix(in srgb, var(--accent) 60%, white));
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-bar-glow {
  position: absolute; top: 0; left: 0; height: 100%; border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35));
  transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-pct-label { font-size: 0.82rem; font-weight: 700; color: var(--accent); min-width: 36px; text-align: right; }

/* Timeline */
.timeline { display: flex; flex-direction: column; max-width: 680px; }
.phase-card {
  display: grid; grid-template-columns: 52px 1fr; gap: 0;
}
.phase-step {
  display: flex; flex-direction: column; align-items: center;
  position: relative;
}
.phase-line {
  width: 2px; flex: 1; min-height: 16px;
  background: var(--border); transition: background 0.3s;
}
.phase-line.lit { background: var(--accent); }
.phase-dot {
  width: 44px; height: 44px; border-radius: 50%;
  display: grid; place-items: center; flex-shrink: 0; position: relative;
  border: 2px solid var(--border); background: var(--surface);
  color: var(--muted); font-size: 0.85rem; font-weight: 700;
  z-index: 1; transition: all 0.25s;
}
.phase-card.done .phase-dot {
  border-color: var(--accent); background: var(--accent); color: var(--text-inverse);
  box-shadow: 0 0 0 4px var(--accent-dim);
}
.phase-card.active .phase-dot {
  border-color: var(--accent); background: var(--surface); color: var(--accent);
  box-shadow: 0 0 0 4px var(--accent-dim);
}
.phase-dot svg { width: 18px; height: 18px; }
.pulse-ring {
  position: absolute; inset: -6px; border-radius: 50%;
  border: 2px solid var(--accent); opacity: 0.5;
  animation: ring-pulse 1.8s ease-out infinite;
}
.pulse-dot {
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--accent);
  animation: dot-pulse 1.8s ease-in-out infinite;
}
@keyframes ring-pulse { 0% { transform: scale(0.9); opacity: 0.6; } 100% { transform: scale(1.5); opacity: 0; } }
@keyframes dot-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(0.85); } }
.phase-num { color: var(--muted); }

.phase-content { padding-bottom: 8px; }
.phase-content-inner {
  margin: 4px 0 4px 16px;
  padding: 16px 20px;
  border: 1px solid var(--border); border-radius: var(--radius-lg);
  background: var(--surface); transition: all 0.2s;
  margin-bottom: 8px;
}
.phase-card.done .phase-content-inner {
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
  background: color-mix(in srgb, var(--accent-dim) 60%, var(--surface));
}
.phase-card.active .phase-content-inner {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-dim), 0 4px 16px -4px color-mix(in srgb, var(--accent) 20%, transparent);
}
.phase-header { margin-bottom: 0; }
.phase-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 6px; }
.phase-name { margin: 0; font-size: 0.97rem; font-weight: 600; }
.phase-desc { margin: 0 0 10px; font-size: 0.87rem; color: var(--muted); line-height: 1.5; }
.phase-badge {
  font-size: 0.7rem; font-weight: 700; padding: 3px 10px; border-radius: 999px;
  letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
  border: 1px solid var(--border); color: var(--muted); background: var(--field-bg);
}
.phase-badge.done { color: var(--accent); background: var(--accent-dim); border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
.phase-badge.active { color: var(--accent); background: var(--accent-dim); border-color: var(--accent); animation: badge-pulse 2s ease-in-out infinite; }
@keyframes badge-pulse { 0%,100% { box-shadow: 0 0 0 0 transparent; } 50% { box-shadow: 0 0 0 3px var(--accent-dim); } }
.phase-footer { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
.phase-date { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; color: var(--muted); }
.phase-active-indicator { display: flex; align-items: center; gap: 8px; font-size: 0.82rem; color: var(--accent); font-weight: 600; }
.active-dot {
  width: 8px; height: 8px; border-radius: 50%; background: var(--accent); flex-shrink: 0;
  animation: dot-pulse 1.4s ease-in-out infinite;
}

/* Files */
.files-header { margin-bottom: 20px; }
.upload-area {
  margin-top: 10px; padding: 28px; border: 2px dashed var(--border);
  border-radius: var(--radius-lg); background: var(--field-bg);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  cursor: pointer; transition: all 0.15s; color: var(--muted);
}
.upload-area:hover, .upload-area.dragging {
  border-color: var(--accent); background: var(--accent-dim); color: var(--accent);
}
.upload-area svg { width: 32px; height: 32px; }
.hidden-input { display: none; }
.file-group { margin-bottom: 24px; }
.file-group h4 { font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin: 0 0 10px; }
.file-list { display: flex; flex-direction: column; gap: 8px; }
.file-row {
  display: grid; grid-template-columns: 36px 1fr auto;
  gap: 12px; align-items: center;
  padding: 10px 14px; border: 1px solid var(--border);
  border-radius: var(--radius); background: var(--surface);
}
.file-icon { color: var(--accent); display: flex; }
.file-icon svg { width: 22px; height: 22px; }
.file-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.file-meta a { color: var(--text); font-weight: 600; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.file-meta a:hover { color: var(--accent); text-decoration: underline; }
.file-del { padding: 4px 8px; font-size: 1rem; }
.file-by { font-size: 0.75rem; }
.error { color: var(--danger); margin-top: 8px; font-size: 0.88rem; }

/* Invoices */
.invoices { display: grid; gap: 14px; }
.invoice-card {
  padding: 20px 22px; border: 1px solid var(--border);
  border-radius: var(--radius-lg); background: var(--surface);
}
.inv-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.inv-num { font-size: 1rem; display: block; }
.inv-title { display: block; font-size: 0.85rem; margin-top: 2px; }
.inv-info { display: flex; flex-wrap: wrap; gap: 14px 28px; font-size: 0.9rem; margin-bottom: 16px; }
.inv-info > div { display: flex; flex-direction: column; gap: 2px; }
.inv-info .muted { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.07em; }
.inv-pdf { display: inline-flex; align-items: center; gap: 7px; font-size: 0.85rem; }
.tag.inv-open { color: var(--warning); background: var(--warning-bg); border-color: var(--warning-border); }
.tag.inv-concept { color: var(--muted); background: var(--field-bg); }
.tag.inv-verstuurd { color: var(--warning); background: var(--warning-bg); border-color: var(--warning-border); }
.tag.inv-deels_betaald { color: var(--accent-2); background: var(--info-bg); border-color: var(--info-border); }
.tag.inv-betaald { color: var(--success); background: var(--success-bg); border-color: var(--success-border); }
.tag.inv-vervallen { color: var(--danger); background: var(--danger-bg); border-color: var(--danger-border); }
.tag.inv-geannuleerd { color: var(--muted); }

/* Services */
.service-market {
  margin-bottom: 24px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 88%, transparent);
}
.service-market-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.service-market-head h3 { margin: 3px 0 0; font-size: 1.05rem; }
.service-options { display: grid; gap: 12px; }
.service-option {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}
.service-option h4 { margin: 0 0 5px; font-size: 1rem; }
.service-option p { margin-bottom: 0; }
.service-option-main { min-width: 0; }
.service-option-side {
  display: flex;
  align-items: center;
  gap: 14px;
}
.service-features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.service-features span {
  padding: 4px 8px;
  border-radius: var(--radius);
  background: var(--field-bg);
  color: var(--muted);
  font-size: 0.73rem;
  font-weight: 700;
}
.success-msg {
  margin: 0 0 16px;
  padding: 10px 12px;
  border: 1px solid var(--success-border);
  border-radius: var(--radius);
  background: var(--success-bg);
  color: var(--success);
  font-size: 0.88rem;
  font-weight: 700;
}
.services { display: grid; gap: 14px; }
.service-card { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border: 1px solid var(--border); border-radius: var(--radius-lg); background: var(--surface); }
.service-card h3 { margin: 0 0 6px; font-size: 1rem; }
.price { font-family: var(--font-display); font-weight: 600; font-size: 1.1rem; }
.tag.status-actief, .tag.status-live { color: var(--success); background: var(--success-bg); border-color: var(--success-border); }
.tag.status-in-uitvoering { color: var(--warning); background: var(--warning-bg); border-color: var(--warning-border); }
.tag.status-beeindigd { color: var(--muted); background: var(--field-bg); }
.tag.status-gepauzeerd, .tag.status-in.uitvoering { color: var(--warning); background: var(--warning-bg); border-color: var(--warning-border); }
.tag.status-beëindigd, .tag.status-opgezegd { color: var(--muted); background: var(--field-bg); }
.tag.status-concept, .tag.status-lead { color: var(--accent-2); background: var(--accent-dim); border-color: var(--border-strong); }

.empty-tab { padding: 40px 0; text-align: center; }

@media (max-width: 900px) {
  .portal-body { grid-template-columns: 1fr; }
  .portal-sidebar { position: static; }
  .sidebar-card { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .sidebar-card-header { width: 100%; margin-bottom: 0; }
}
@media (max-width: 640px) {
  .portal-header { flex-direction: column; }
  .tabs { overflow-x: auto; width: 100%; }
  .phase-card { grid-template-columns: 40px 1fr; }
  .phase-dot { width: 36px; height: 36px; }
  .progress-header { padding: 18px; }
  .progress-stat-value { font-size: 1.2rem; }
  .file-row { grid-template-columns: 30px 1fr auto; }
  .service-option { grid-template-columns: 1fr; }
  .service-option-side { justify-content: space-between; }
}
</style>

