<template>
  <div class="customers-view">
    <header class="head">
      <div>
        <h1>Klanten</h1>
        <p class="muted">Beheer klanten, hun bedrijfsinfo en diensten.</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">+ Klant toevoegen</button>
    </header>

    <div class="layout" :class="{ 'show-detail': mobileView === 'detail' }">
      <aside class="customer-list">
        <div class="search">
          <input
            v-model="searchQuery"
            class="input"
            type="search"
            placeholder="Zoek op bedrijf, contact of e-mail..."
          />
        </div>
        <div class="cust-items">
          <button
            v-for="c in filteredCustomers"
            :key="c.id"
            class="cust-item"
            :class="{ active: selected?.id === c.id }"
            @click="select(c)"
          >
            <div class="title">{{ c.company || c.contactName || 'Naamloos' }}</div>
            <div class="meta">
              <span class="muted small">{{ c.contactName || c.email }}</span>
              <span class="tag" :class="`status-${statusKey(c.status)}`">{{ c.status }}</span>
            </div>
          </button>
          <p v-if="!filteredCustomers.length && searchQuery" class="muted small empty-search">
            Geen klanten gevonden voor "{{ searchQuery }}".
          </p>
          <p v-else-if="!admin.customers.length" class="muted small empty-search">
            Nog geen klanten.
          </p>
        </div>
      </aside>

      <section v-if="selected" class="editor">
        <button class="back-btn" type="button" @click="mobileView = 'list'">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Terug naar lijst
        </button>

        <div class="editor-head">
          <div>
            <h2>{{ selected.company || selected.contactName || 'Klant' }}</h2>
            <span class="muted small">{{ selected.email }}</span>
          </div>
          <span class="tag" :class="`status-${statusKey(selected.status)}`">{{ selected.status }}</span>
        </div>

        <div class="grid grid-2">
          <div><label class="label">Bedrijf</label><input v-model="selected.company" class="input" @input="queueCustomer" /></div>
          <div><label class="label">Contactpersoon</label><input v-model="selected.contactName" class="input" @input="queueCustomer" /></div>
          <div><label class="label">E-mail</label><input v-model="selected.email" type="email" class="input" @input="queueCustomer" /></div>
          <div><label class="label">Telefoon</label><input v-model="selected.phone" class="input" @input="queueCustomer" /></div>
          <div><label class="label">Website</label><input v-model="selected.website" class="input" @input="queueCustomer" /></div>
          <div><label class="label">Status</label>
            <select v-model="selected.status" class="select" @change="queueCustomer">
              <option v-for="s in statusOptions" :key="s">{{ s }}</option>
            </select>
          </div>
          <div><label class="label">KVK</label><input v-model="selected.kvk" class="input" @input="queueCustomer" /></div>
          <div><label class="label">BTW nummer</label><input v-model="selected.btw" class="input" @input="queueCustomer" /></div>
        </div>
        <label class="label mt">Adres</label>
        <input v-model="selected.address" class="input" @input="queueCustomer" />
        <div class="grid grid-2 mt">
          <div><label class="label">Maandbedrag (€)</label>
            <input v-model.number="selected.monthlyTotal" type="number" min="0" step="0.01" class="input" @input="queueCustomer" /></div>
          <div><label class="label">Volgende factuur</label>
            <input v-model="selected.nextInvoice" type="date" class="input" @input="queueCustomer" /></div>
        </div>
        <label class="label mt">Notities</label>
        <textarea v-model="selected.notes" class="textarea" rows="3" @input="queueCustomer"></textarea>

        <div class="actions">
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? 'Opslaan...' : 'Nu opslaan' }}
          </button>
          <button class="btn btn-ghost danger" @click="remove">Verwijderen</button>
          <span v-if="customerSavingKey === selected.id" class="muted small">Autosave...</span>
          <span v-else-if="customerSavedAt" class="muted small">Opgeslagen om {{ customerSavedAt }}.</span>
        </div>
        <p v-if="customerError" class="error">Autosave fout: {{ customerError }}</p>
        <p v-if="actionError" class="error">{{ actionError }}</p>

        <div class="services-section">
          <div class="flex between">
            <h3>Diensten</h3>
            <button class="btn btn-ghost" @click="addService">+ Dienst</button>
          </div>
          <div class="services">
            <div v-for="s in selected.services" :key="s.id" class="svc">
              <input v-model="s.name" class="input" placeholder="Dienst" @input="queueService(s)" />
              <select v-model="s.status" class="select" @change="queueService(s)">
                <option>Actief</option><option>In uitvoering</option>
                <option>Gepauzeerd</option><option>Beëindigd</option>
              </select>
              <input v-model.number="s.price" type="number" min="0" step="0.01" class="input" placeholder="Prijs" @input="queueService(s)" />
              <input v-model="s.period" class="input" placeholder="periode" @input="queueService(s)" />
              <button class="btn btn-ghost danger svc-del" @click="removeService(s.id)" aria-label="Dienst verwijderen">×</button>
            </div>
            <p v-if="serviceSavedAt && !serviceError" class="muted small">Diensten opgeslagen om {{ serviceSavedAt }}.</p>
            <p v-if="serviceError" class="error">Dienst autosave fout: {{ serviceError }}</p>
            <p v-if="!selected.services?.length" class="muted small">Nog geen diensten.</p>
          </div>
        </div>
      </section>

      <section v-else class="editor empty">
        <div class="empty-state">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19V8l7-5 7 5v11M5 19h14M9 19v-6h6v6" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <h2>{{ admin.customers.length ? 'Selecteer een klant' : 'Nog geen klanten' }}</h2>
          <p class="muted">{{ admin.customers.length ? 'Kies een klant in de lijst om gegevens en diensten te beheren.' : 'Voeg je eerste klant toe om te beginnen.' }}</p>
          <button v-if="!admin.customers.length" class="btn btn-primary" @click="openAddModal">+ Eerste klant aanmaken</button>
        </div>
      </section>
    </div>

    <div v-if="showAddModal" class="modal-backdrop" @click.self="closeAddModal">
      <div class="modal" role="dialog" aria-labelledby="add-customer-title">
        <header class="modal-head">
          <h2 id="add-customer-title">Nieuwe klant</h2>
          <button class="modal-close" type="button" @click="closeAddModal" aria-label="Sluiten">×</button>
        </header>
        <form @submit.prevent="submitAdd" class="modal-body" novalidate>
          <div class="grid grid-2">
            <div>
              <label class="label" for="new-company">Bedrijf</label>
              <input
                id="new-company"
                v-model="newCustomer.company"
                class="input"
                :class="{ 'has-error': fieldErrors.company }"
                placeholder="Bijv. Nova Studio"
                ref="firstField"
              />
            </div>
            <div>
              <label class="label" for="new-contact">Contactpersoon</label>
              <input
                id="new-contact"
                v-model="newCustomer.contactName"
                class="input"
                :class="{ 'has-error': fieldErrors.contactName }"
                placeholder="Voor- en achternaam"
              />
            </div>
          </div>
          <p v-if="fieldErrors.companyOrContact" class="field-error">{{ fieldErrors.companyOrContact }}</p>

          <label class="label mt" for="new-email">E-mail *</label>
          <input
            id="new-email"
            v-model="newCustomer.email"
            type="email"
            class="input"
            :class="{ 'has-error': fieldErrors.email }"
            placeholder="naam@voorbeeld.nl"
            required
          />
          <p v-if="fieldErrors.email" class="field-error">{{ fieldErrors.email }}</p>

          <div class="grid grid-2 mt">
            <div>
              <label class="label" for="new-phone">Telefoon</label>
              <input id="new-phone" v-model="newCustomer.phone" class="input" placeholder="+31 6 12345678" />
            </div>
            <div>
              <label class="label" for="new-status">Status</label>
              <select id="new-status" v-model="newCustomer.status" class="select">
                <option v-for="s in statusOptions" :key="s">{{ s }}</option>
              </select>
            </div>
          </div>

          <p v-if="addError" class="error mt">{{ addError }}</p>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="closeAddModal" :disabled="adding">Annuleren</button>
            <button type="submit" class="btn btn-primary" :disabled="adding">
              {{ adding ? 'Aanmaken...' : 'Klant aanmaken' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useAutosave } from '../../composables/autosave'

const admin = useAdminStore()
const selected = ref(null)
const saving = ref(false)
const actionError = ref('')
const searchQuery = ref('')
const mobileView = ref('list')

const showAddModal = ref(false)
const adding = ref(false)
const addError = ref('')
const fieldErrors = ref({})
const firstField = ref(null)
const newCustomer = ref(emptyNewCustomer())

const statusOptions = ['Lead', 'Concept', 'Actief', 'Live', 'Gepauzeerd', 'Beëindigd']

const {
  savingKey: customerSavingKey,
  savedAt: customerSavedAt,
  error: customerError,
  queue: queueCustomerSave,
  flush: flushCustomer,
} = useAutosave((customer) => admin.updateCustomer(customer))
const {
  savedAt: serviceSavedAt,
  error: serviceError,
  queue: queueServiceSave,
  flush: flushService,
} = useAutosave((payload) => admin.updateService(payload.customerId, payload.service))

const filteredCustomers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = admin.customers
  if (!q) return list
  return list.filter((c) => {
    const hay = `${c.company || ''} ${c.contactName || ''} ${c.email || ''}`.toLowerCase()
    return hay.includes(q)
  })
})

onMounted(async () => {
  await admin.load()
  if (admin.customers.length && !selected.value) selectQuiet(admin.customers[0])
})

function emptyNewCustomer() {
  return { company: '', contactName: '', email: '', phone: '', status: 'Lead' }
}

function statusKey(status) {
  return String(status || '').toLowerCase().replace(/[^a-z]+/g, '-') || 'unknown'
}

function normalizeCustomer(c) {
  return {
    ...c,
    services: Array.isArray(c.services) ? c.services : [],
    nextInvoice: c.nextInvoice ? String(c.nextInvoice).slice(0, 10) : '',
  }
}

function cleanCustomer(c) {
  return {
    ...c,
    email: String(c.email || '').trim(),
    nextInvoice: c.nextInvoice || null,
    services: Array.isArray(c.services) ? c.services : [],
  }
}

function selectQuiet(c) {
  actionError.value = ''
  selected.value = normalizeCustomer(JSON.parse(JSON.stringify(c)))
}

function select(c) {
  selectQuiet(c)
  mobileView.value = 'detail'
}

function queueCustomer() {
  if (!selected.value) return
  nextTick(() => queueCustomerSave(selected.value.id, cleanCustomer(JSON.parse(JSON.stringify(selected.value)))))
}

function queueService(s) {
  if (!selected.value) return
  nextTick(() => queueServiceSave(s.id, { customerId: selected.value.id, service: { ...s } }))
}

function openAddModal() {
  newCustomer.value = emptyNewCustomer()
  fieldErrors.value = {}
  addError.value = ''
  showAddModal.value = true
  nextTick(() => firstField.value?.focus())
}

function closeAddModal() {
  if (adding.value) return
  showAddModal.value = false
}

function validateNewCustomer() {
  const errs = {}
  const c = newCustomer.value
  const hasIdentity = (c.company || '').trim() || (c.contactName || '').trim()
  if (!hasIdentity) {
    errs.companyOrContact = 'Vul minstens een bedrijf of contactpersoon in.'
    errs.company = true
    errs.contactName = true
  }
  const email = String(c.email || '').trim()
  if (!email) {
    errs.email = 'E-mail is verplicht.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errs.email = 'Geen geldig e-mailadres.'
  }
  fieldErrors.value = errs
  return Object.keys(errs).length === 0
}

async function submitAdd() {
  addError.value = ''
  if (!validateNewCustomer()) return
  adding.value = true
  try {
    const created = await admin.createCustomer({
      company: newCustomer.value.company.trim(),
      contactName: newCustomer.value.contactName.trim(),
      email: newCustomer.value.email.trim(),
      phone: newCustomer.value.phone.trim(),
      status: newCustomer.value.status || 'Lead',
      monthlyTotal: 0,
      nextInvoice: null,
      services: [],
    })
    showAddModal.value = false
    select(created)
  } catch (e) {
    addError.value = e.message || 'Er ging iets mis bij het aanmaken.'
  } finally {
    adding.value = false
  }
}

async function save() {
  if (!selected.value) return
  saving.value = true
  try {
    actionError.value = ''
    const r = await flushCustomer(selected.value.id, cleanCustomer(JSON.parse(JSON.stringify(selected.value))))
    selected.value = normalizeCustomer(JSON.parse(JSON.stringify(r)))
  } catch (e) {
    actionError.value = e.message
  } finally { saving.value = false }
}

async function remove() {
  if (!selected.value) return
  const label = selected.value.company || selected.value.contactName || selected.value.email
  if (!confirm(`Klant "${label}" en alle diensten verwijderen?`)) return
  try {
    await admin.deleteCustomer(selected.value.id)
    selected.value = admin.customers[0] ? normalizeCustomer(JSON.parse(JSON.stringify(admin.customers[0]))) : null
    mobileView.value = 'list'
  } catch (e) {
    actionError.value = e.message
  }
}

async function addService() {
  try {
    const r = await admin.createService(selected.value.id, {
      name: 'Nieuwe dienst', status: 'Actief', price: 0, period: 'maand',
      sortOrder: (selected.value.services?.length || 0) + 1,
    })
    selected.value.services.push(r)
  } catch (e) {
    actionError.value = e.message
  }
}

async function removeService(id) {
  if (!confirm('Dienst verwijderen?')) return
  try {
    await admin.deleteService(selected.value.id, id)
    selected.value.services = selected.value.services.filter((x) => x.id !== id)
  } catch (e) {
    actionError.value = e.message
  }
}
</script>

<style scoped>
.customers-view { display: flex; flex-direction: column; }
.head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 20px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }

.layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.customer-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 32px);
}
.search { padding: 0; }
.search .input { padding: 9px 12px; font-size: 0.9rem; }
.cust-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
  padding-right: 4px;
}
.cust-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.cust-item:hover { background: var(--surface-hover); }
.cust-item.active {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, transparent), color-mix(in srgb, var(--accent-2) 12%, transparent));
  border-color: var(--border-strong);
}
.cust-item .title { font-weight: 600; font-size: 0.95rem; }
.cust-item .meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.empty-search { padding: 8px 4px; }

.editor {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 26px;
  min-width: 0;
}
.editor.empty { padding: 60px 24px; text-align: center; }
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 360px;
  margin: 0 auto;
  color: var(--muted);
}
.empty-state svg { width: 56px; height: 56px; color: var(--accent); }
.empty-state h2 { margin: 0; color: var(--text); font-size: 1.4rem; }
.empty-state p { margin: 0; }
.empty-state .btn { margin-top: 6px; }

.editor-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.editor-head h2 { margin: 0 0 2px; font-size: 1.3rem; }

.back-btn {
  display: none;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
}
.back-btn svg { width: 16px; height: 16px; }
.back-btn:hover { border-color: var(--accent-2); color: var(--accent-2); }

.mt { margin-top: 14px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 22px; padding-top: 22px; border-top: 1px solid var(--border); }
.danger { color: var(--danger); border-color: var(--danger-border); }
.danger:hover { background: var(--danger-bg); }
.error { color: var(--danger); margin-top: 10px; }

.services-section { margin-top: 30px; padding-top: 24px; border-top: 1px solid var(--border); }
.services-section h3 { font-size: 1.05rem; margin: 0; }
.services { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
.svc {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
}
.svc-del {
  width: 38px;
  padding: 8px 0;
  font-size: 1.1rem;
  line-height: 1;
}

.tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--muted);
  white-space: nowrap;
}
.tag.status-lead, .tag.status-concept { color: var(--accent-2); background: var(--info-bg); border-color: var(--info-border); }
.tag.status-actief, .tag.status-live { color: var(--success); background: var(--success-bg); border-color: var(--success-border); }
.tag.status-gepauzeerd { color: var(--warning); background: var(--warning-bg); border-color: var(--warning-border); }
.tag.status-be-indigd { color: var(--danger); background: var(--danger-bg); border-color: var(--danger-border); }

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: color-mix(in srgb, var(--text) 50%, transparent);
  backdrop-filter: blur(3px);
  display: grid;
  place-items: center;
  padding: 20px;
}
.modal {
  width: min(560px, 100%);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}
.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  border-bottom: 1px solid var(--border);
}
.modal-head h2 { margin: 0; font-size: 1.2rem; }
.modal-close {
  width: 32px;
  height: 32px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--muted);
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
}
.modal-close:hover { color: var(--text); border-color: var(--accent-2); }
.modal-body { padding: 22px; }
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
}

.has-error { border-color: var(--danger); }
.field-error { color: var(--danger); font-size: 0.82rem; margin: 6px 0 0; }

@media (max-width: 1100px) {
  .svc { grid-template-columns: 1fr 1fr auto; }
  .svc > :nth-child(3), .svc > :nth-child(4) { grid-column: span 1; }
}
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .customer-list { position: static; max-height: none; }
  .cust-items { max-height: 50vh; }
  .editor { display: none; }
  .layout.show-detail .customer-list { display: none; }
  .layout.show-detail .editor { display: block; }
  .back-btn { display: inline-flex; }
  .editor-head { flex-direction: column; gap: 8px; }
  .svc { grid-template-columns: 1fr 1fr; }
  .svc > :nth-child(5) { grid-column: span 2; justify-self: end; }
}
</style>
