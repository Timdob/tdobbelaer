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

        <button
          v-if="selected.monthlyTotal > 0"
          type="button"
          class="btn btn-ghost quick-invoice-btn"
          @click="openQuickInvoice"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M12 5v14m-7-7h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Volgende factuur aanmaken — €{{ formatPrice(selected.monthlyTotal) }}
        </button>

        <div class="actions">
          <button class="btn btn-ghost danger" @click="remove">Verwijderen</button>
          <span v-if="customerSavingKey === selected.id" class="muted small">Autosave...</span>
          <span v-else-if="customerSavedAt" class="muted small">Opgeslagen om {{ customerSavedAt }}.</span>
        </div>
        <p v-if="customerError" class="error">Autosave fout: {{ customerError }}</p>
        <p v-if="actionError" class="error">{{ actionError }}</p>

        <div class="login-section">
          <div class="flex between">
            <h3>Portaal login</h3>
          </div>
          <template v-if="customerLogin">
            <div class="login-info">
              <div>
                <span class="muted small">E-mail</span>
                <strong>{{ customerLogin.email }}</strong>
              </div>
              <span class="tag status-actief">Actief</span>
            </div>
            <div class="login-reset" v-if="showResetPassword">
              <input
                v-model="resetPasswordValue"
                type="password"
                class="input"
                placeholder="Nieuw wachtwoord (min. 8 tekens)"
                autocomplete="new-password"
              />
              <div class="login-actions">
                <button class="btn btn-ghost" type="button" @click="showResetPassword = false">Annuleren</button>
                <button class="btn btn-primary" type="button" :disabled="loginBusy" @click="doResetPassword">
                  {{ loginBusy ? 'Opslaan...' : 'Wachtwoord opslaan' }}
                </button>
              </div>
            </div>
            <div v-else class="login-actions">
              <button class="btn btn-ghost" type="button" @click="showResetPassword = true">Wachtwoord wijzigen</button>
              <button class="btn btn-ghost" type="button" :disabled="loginBusy" @click="sendPasswordReset">
                {{ loginBusy ? 'Versturen...' : 'Stuur resetmail' }}
              </button>
              <button class="btn btn-ghost danger" type="button" :disabled="loginBusy" @click="doDeleteLogin">Login verwijderen</button>
            </div>
          </template>
          <template v-else>
            <p class="muted small">Geen portaallogin. Maak er een aan zodat de klant kan inloggen.</p>
            <div v-if="showCreateLogin" class="login-create">
              <div class="grid grid-2">
                <div>
                  <label class="label">E-mail</label>
                  <input v-model="newLogin.email" type="email" class="input" placeholder="klant@voorbeeld.nl" autocomplete="off" />
                </div>
                <div>
                  <label class="label">Wachtwoord</label>
                  <input v-model="newLogin.password" type="password" class="input" placeholder="Min. 8 tekens" autocomplete="new-password" />
                </div>
              </div>
              <p v-if="loginError" class="error">{{ loginError }}</p>
              <div class="login-actions">
                <button class="btn btn-ghost" type="button" @click="showCreateLogin = false">Annuleren</button>
                <button class="btn btn-primary" type="button" :disabled="loginBusy" @click="doCreateLogin">
                  {{ loginBusy ? 'Aanmaken...' : 'Login aanmaken' }}
                </button>
              </div>
            </div>
            <button v-else class="btn btn-ghost" type="button" @click="openCreateLogin">+ Login aanmaken</button>
          </template>
          <p v-if="loginError && !showCreateLogin" class="error">{{ loginError }}</p>
        </div>

        <div class="mail-section">
          <div class="flex between">
            <h3>Klant mailen</h3>
            <button class="btn btn-ghost" type="button" @click="refreshMailTemplates">Templates verversen</button>
          </div>
          <div class="mail-grid">
            <div>
              <label class="label">Template</label>
              <select v-model="selectedMailTemplateId" class="select" @change="prepareCustomerMail">
                <option value="">Kies een template</option>
                <option v-for="template in customerMailTemplates" :key="template.id" :value="template.id">
                  {{ template.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="label">Ontvanger</label>
              <input v-model="customerMailTo" type="email" class="input" />
            </div>
          </div>
          <label class="label mt">Variabelen als JSON</label>
          <textarea v-model="customerMailVariables" class="textarea json-area" rows="6"></textarea>
          <div class="login-actions mt">
            <button class="btn btn-primary" type="button" :disabled="customerMailSending || !selectedMailTemplateId" @click="sendCustomerMail">
              {{ customerMailSending ? 'Versturen...' : 'Mail versturen' }}
            </button>
          </div>
          <p v-if="customerMailStatus" class="muted small">{{ customerMailStatus }}</p>
          <p v-if="customerMailError" class="error">{{ customerMailError }}</p>
        </div>

        <!-- Projectfases -->
        <div class="extra-section">
          <div class="flex between">
            <h3>Projectfases
              <span v-if="phases.length" class="phase-progress-label">{{ phases.filter(p=>p.status==='done').length }}/{{ phases.length }}</span>
            </h3>
            <button class="btn btn-ghost" type="button" @click="addPhase">+ Fase</button>
          </div>
          <div v-if="phases.length" class="phase-progress-bar">
            <div class="phase-progress-fill" :style="{ width: Math.round(phases.filter(p=>p.status==='done').length / phases.length * 100) + '%' }"></div>
          </div>
          <div class="phases-list">
            <div v-for="phase in phases" :key="phase.id" class="phase-row">
              <input v-model="phase.name" class="input" placeholder="Naam fase" @change="savePhase(phase)" />
              <input v-model="phase.description" class="input" placeholder="Omschrijving (optioneel)" @change="savePhase(phase)" />
              <select v-model="phase.status" class="select" @change="savePhase(phase)">
                <option value="pending">Aankomend</option>
                <option value="active">Actief</option>
                <option value="done">Afgerond</option>
              </select>
              <button class="btn btn-ghost danger svc-del" type="button" @click="deletePhase(phase.id)">×</button>
            </div>
            <p v-if="!phases.length" class="muted small">Nog geen fases. Voeg ze toe zodat de klant de voortgang ziet.</p>
          </div>
        </div>

        <!-- Facturen -->
        <div class="extra-section">
          <div class="flex between">
            <h3>Facturen</h3>
            <button class="btn btn-ghost" type="button" @click="openNewInvoice">+ Factuur</button>
          </div>
          <div class="invoices-list">
            <div v-for="inv in invoices" :key="inv.id" class="invoice-row">
              <div class="inv-meta">
                <strong>{{ inv.invoiceNumber || `#${inv.id}` }}</strong>
                <span class="muted small">{{ inv.title }}</span>
              </div>
              <span class="tag" :class="`inv-${inv.status}`">{{ inv.status }}</span>
              <span>€ {{ formatPrice(inv.total) }}</span>
              <div class="inv-actions">
                <button class="btn btn-ghost" type="button" @click="openEditInvoice(inv)">Wijzig</button>
                <a class="btn btn-ghost" :href="`/api/invoices/${inv.id}/pdf?token=${authStore.token}`" target="_blank" rel="noopener">PDF</a>
                <button class="btn btn-ghost danger" type="button" @click="deleteInvoice(inv.id)">×</button>
              </div>
            </div>
            <p v-if="!invoices.length" class="muted small">Nog geen facturen.</p>
          </div>
        </div>

        <!-- Website monitor -->
        <div v-if="selected.website" class="extra-section">
          <div class="flex between">
            <h3>Website monitor</h3>
            <button class="btn btn-ghost" type="button" :disabled="monitorChecking" @click="triggerMonitorCheck">
              {{ monitorChecking ? 'Checken...' : 'Nu checken' }}
            </button>
          </div>
          <div v-if="latestMonitorCheck" class="monitor-row" :class="latestMonitorCheck.status">
            <span class="monitor-dot-adm" :class="latestMonitorCheck.status"></span>
            <div class="monitor-details">
              <strong>
                <template v-if="latestMonitorCheck.status === 'up'">Online</template>
                <template v-else-if="latestMonitorCheck.status === 'warning'">Waarschuwing</template>
                <template v-else-if="latestMonitorCheck.status === 'error'">Fout</template>
                <template v-else>Onbekend</template>
              </strong>
              <span v-if="latestMonitorCheck.error" class="muted small">{{ latestMonitorCheck.error }}</span>
              <span v-if="latestMonitorCheck.status_code" class="muted small">HTTP {{ latestMonitorCheck.status_code }}</span>
            </div>
            <span v-if="latestMonitorCheck.response_ms" class="muted small">{{ latestMonitorCheck.response_ms }}ms</span>
            <span class="muted small">{{ formatDate(latestMonitorCheck.checked_at) }}</span>
          </div>
          <p v-else class="muted small" style="margin-top:8px">Nog geen check uitgevoerd. Elke 5 minuten automatisch.</p>
        </div>

        <!-- Bestanden -->
        <div class="extra-section">
          <h3>Bestanden van klant</h3>
          <div class="files-list">
            <div v-for="f in clientFiles" :key="f.id" class="file-row">
              <span class="file-name">{{ f.originalName }}</span>
              <span class="muted small">{{ f.category }}</span>
              <span class="muted small">{{ formatFileSize(f.sizeBytes) }}</span>
              <div class="inv-actions">
                <a class="btn btn-ghost" :href="f.url" target="_blank" rel="noopener">Download</a>
                <button class="btn btn-ghost danger" type="button" @click="deleteClientFile(f.id)">×</button>
              </div>
            </div>
            <p v-if="!clientFiles.length" class="muted small">Klant heeft nog geen bestanden gedeeld.</p>
          </div>
        </div>

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

    <!-- Factuur modal -->
    <div v-if="showInvoiceModal" class="modal-backdrop" @click.self="showInvoiceModal = false">
      <div class="modal modal-wide" role="dialog" aria-label="Factuur">
        <header class="modal-head">
          <h2>{{ editingInvoice?.id ? 'Factuur wijzigen' : 'Nieuwe factuur' }}</h2>
          <button class="modal-close" type="button" @click="showInvoiceModal = false">×</button>
        </header>
        <div class="modal-body">
          <div class="grid grid-2">
            <div>
              <label class="label">Factuurnummer</label>
              <input v-model="invoiceForm.invoiceNumber" class="input" placeholder="2024-001" />
            </div>
            <div>
              <label class="label">Titel</label>
              <input v-model="invoiceForm.title" class="input" placeholder="Website onderhoud Q1" />
            </div>
            <div>
              <label class="label">Datum</label>
              <input v-model="invoiceForm.issueDate" type="date" class="input" />
            </div>
            <div>
              <label class="label">Vervaldatum</label>
              <input v-model="invoiceForm.dueDate" type="date" class="input" />
            </div>
            <div>
              <label class="label">Status</label>
              <select v-model="invoiceForm.status" class="select">
                <option value="concept">Concept</option>
                <option value="verstuurd">Verstuurd</option>
                <option value="open">Open</option>
                <option value="deels_betaald">Deels betaald</option>
                <option value="betaald">Betaald</option>
                <option value="vervallen">Vervallen</option>
                <option value="geannuleerd">Geannuleerd</option>
              </select>
            </div>
            <div>
              <label class="label">BTW (%)</label>
              <input v-model.number="invoiceForm.taxRate" type="number" min="0" max="100" class="input" />
            </div>
          </div>

          <div class="inv-lines-head">
            <h4>Regels</h4>
            <button class="btn btn-ghost" type="button" @click="addInvoiceLine">+ Regel</button>
          </div>
          <div class="inv-lines">
            <div class="inv-line-header">
              <span class="muted small">Omschrijving</span>
              <span class="muted small">Aantal</span>
              <span class="muted small">Stukprijs (€)</span>
              <span class="muted small">Bedrag (€)</span>
              <span></span>
            </div>
            <div v-for="(line, i) in invoiceForm.lines" :key="i" class="inv-line">
              <input v-model="line.description" class="input" placeholder="Omschrijving" />
              <input v-model.number="line.quantity" type="number" min="0" step="0.01" class="input" @input="calcLine(line)" />
              <input v-model.number="line.unitPrice" type="number" min="0" step="0.01" class="input" @input="calcLine(line)" />
              <input :value="line.amount.toFixed(2)" class="input" readonly />
              <button class="btn btn-ghost danger svc-del" type="button" @click="invoiceForm.lines.splice(i,1)">×</button>
            </div>
            <p v-if="!invoiceForm.lines.length" class="muted small">Nog geen regels.</p>
          </div>

          <div class="inv-totals">
            <span>Subtotaal</span><span>€ {{ formatPrice(invoiceSubtotal) }}</span>
            <span>BTW {{ invoiceForm.taxRate }}%</span><span>€ {{ formatPrice(invoiceSubtotal * invoiceForm.taxRate / 100) }}</span>
            <strong>Totaal</strong><strong>€ {{ formatPrice(invoiceSubtotal * (1 + invoiceForm.taxRate / 100)) }}</strong>
          </div>

          <label class="label mt">Notities</label>
          <textarea v-model="invoiceForm.notes" class="textarea" rows="2"></textarea>

          <p v-if="invoiceError" class="error mt">{{ invoiceError }}</p>
          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" @click="showInvoiceModal = false">Annuleren</button>
            <button type="button" class="btn btn-primary" :disabled="invoiceSaving" @click="saveInvoice">
              {{ invoiceSaving ? 'Opslaan...' : 'Opslaan' }}
            </button>
          </div>
        </div>
      </div>
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
import { computed, nextTick, ref, onMounted, watch, reactive } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useAuthStore } from '../../stores/auth'
import { useAutosave } from '../../composables/autosave'
import { api } from '../../composables/api'

const authStore = useAuthStore()

const admin = useAdminStore()
const selected = ref(null)
const actionError = ref('')

// Login state
const customerLogin = ref(null)
const loginBusy = ref(false)
const loginError = ref('')
const showCreateLogin = ref(false)
const showResetPassword = ref(false)
const newLogin = ref({ email: '', password: '' })
const resetPasswordValue = ref('')
const selectedMailTemplateId = ref('')
const customerMailTo = ref('')
const customerMailVariables = ref('')
const customerMailSending = ref(false)
const customerMailStatus = ref('')
const customerMailError = ref('')

const customerMailTemplates = computed(() => admin.mailTemplates.filter((template) => template.enabled))

watch(() => selected.value?.id, async (id) => {
  customerLogin.value = null
  loginError.value = ''
  showCreateLogin.value = false
  showResetPassword.value = false
  selectedMailTemplateId.value = ''
  customerMailTo.value = selected.value?.email || ''
  customerMailVariables.value = JSON.stringify(allCustomerMailVariables.value, null, 2)
  customerMailStatus.value = ''
  customerMailError.value = ''
  phases.value = []
  invoices.value = []
  clientFiles.value = []
  if (!id) return
  try {
    const [lr, pr, ir, fr] = await Promise.all([
      api.get(`/api/admin/customers/${id}/login`),
      api.get(`/api/admin/customers/${id}/phases`),
      api.get(`/api/admin/customers/${id}/invoices`),
      api.get(`/api/admin/customers/${id}/files`),
    ])
    customerLogin.value = lr.login
    phases.value = pr.phases
    invoices.value = ir.invoices
    clientFiles.value = fr.files
    if (selected.value?.website) {
      const mr = await api.get(`/api/admin/customers/${id}/monitor`)
      monitorChecks.value = mr.checks
    }
  } catch {}
})

const allCustomerMailVariables = computed(() => {
  const customer = selected.value || {}
  return {
    naam: customer.contactName || customer.company || '',
    bedrijf: customer.company || '',
    email: customer.email || '',
    telefoon: customer.phone || '',
    website: customer.website || '',
    contactpersoon: customer.contactName || '',
    login_url: `${window.location.origin}/login`,
    reset_url: `${window.location.origin}/wachtwoord-resetten?token=wordt-automatisch-gegenereerd`,
    project: customer.company || 'Website',
    bericht: '',
    datum: new Date().toLocaleDateString('nl-NL'),
  }
})

async function refreshMailTemplates() {
  await admin.loadMailTemplates()
}

function prepareCustomerMail() {
  customerMailStatus.value = ''
  customerMailError.value = ''
  if (!customerMailTo.value) customerMailTo.value = selected.value?.email || ''
  const template = admin.mailTemplates.find((t) => t.id === selectedMailTemplateId.value)
  const keys = template?.variables?.length ? template.variables : Object.keys(allCustomerMailVariables.value)
  const vars = {}
  for (const k of keys) {
    if (k in allCustomerMailVariables.value) vars[k] = allCustomerMailVariables.value[k]
  }
  customerMailVariables.value = JSON.stringify(vars, null, 2)
}

async function sendCustomerMail() {
  customerMailStatus.value = ''
  customerMailError.value = ''
  customerMailSending.value = true
  try {
    let variables = {}
    try { variables = JSON.parse(customerMailVariables.value || '{}') }
    catch { throw new Error('Variabelen moeten geldige JSON zijn.') }
    await admin.sendMailTemplate(selectedMailTemplateId.value, { to: customerMailTo.value, variables })
    customerMailStatus.value = 'Mail verzonden.'
  } catch (e) {
    customerMailError.value = e.message
  } finally {
    customerMailSending.value = false
  }
}

function openCreateLogin() {
  newLogin.value = { email: selected.value?.email || '', password: '' }
  loginError.value = ''
  showCreateLogin.value = true
}

async function doCreateLogin() {
  loginError.value = ''
  loginBusy.value = true
  try {
    const r = await api.post(`/api/admin/customers/${selected.value.id}/login`, newLogin.value)
    customerLogin.value = r.login
    showCreateLogin.value = false
  } catch (e) {
    loginError.value = e.message
  } finally {
    loginBusy.value = false
  }
}

async function doResetPassword() {
  loginError.value = ''
  loginBusy.value = true
  try {
    await api.put(`/api/admin/customers/${selected.value.id}/login`, { password: resetPasswordValue.value })
    showResetPassword.value = false
    resetPasswordValue.value = ''
  } catch (e) {
    loginError.value = e.message
  } finally {
    loginBusy.value = false
  }
}

// ── Phases ──────────────────────────────────────────────────────────────────
const phases = ref([])

async function addPhase() {
  const r = await api.post(`/api/admin/customers/${selected.value.id}/phases`, {
    name: 'Nieuwe fase', status: 'pending', sortOrder: phases.value.length,
  })
  phases.value.push(r)
}
async function savePhase(phase) {
  await api.put(`/api/admin/phases/${phase.id}`, phase)
}
async function deletePhase(id) {
  if (!confirm('Fase verwijderen?')) return
  await api.del(`/api/admin/phases/${id}`)
  phases.value = phases.value.filter((p) => p.id !== id)
}

// ── Invoices ─────────────────────────────────────────────────────────────────
const invoices = ref([])
const clientFiles = ref([])
const monitorChecks = ref([])
const monitorChecking = ref(false)
const latestMonitorCheck = computed(() => monitorChecks.value[0] || null)
const showInvoiceModal = ref(false)
const invoiceError = ref('')
const invoiceSaving = ref(false)
const editingInvoice = ref(null)

function formatDate(d) {
  if (!d) return ''
  return new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

async function deleteClientFile(id) {
  if (!confirm('Bestand verwijderen?')) return
  await api.del(`/api/admin/files/${id}`)
  clientFiles.value = clientFiles.value.filter((f) => f.id !== id)
}

async function triggerMonitorCheck() {
  monitorChecking.value = true
  try {
    const r = await api.post(`/api/admin/customers/${selected.value.id}/monitor/check`, {})
    monitorChecks.value = [r.check, ...monitorChecks.value].slice(0, 20)
  } catch (e) {
    alert(e.message)
  } finally {
    monitorChecking.value = false
  }
}

function formatPrice(n) {
  return new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n ?? 0)
}

function emptyInvoiceForm() {
  return {
    invoiceNumber: '', title: '', status: 'open',
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: '', taxRate: 21, notes: '', lines: [],
  }
}
const invoiceForm = reactive(emptyInvoiceForm())
const invoiceSubtotal = computed(() => invoiceForm.lines.reduce((s, l) => s + (l.amount || 0), 0))

function calcLine(line) {
  line.amount = Math.round(Number(line.quantity || 0) * Number(line.unitPrice || 0) * 100) / 100
}
function addInvoiceLine() {
  invoiceForm.lines.push({ description: '', quantity: 1, unitPrice: 0, amount: 0 })
}
function openQuickInvoice() {
  editingInvoice.value = null
  const today = new Date()
  const due = new Date(today); due.setDate(due.getDate() + 14)
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const month = today.toLocaleString('nl-NL', { month: 'long', year: 'numeric' })
  const services = selected.value?.services || []
  const lines = services.length
    ? services.filter(s => s.status === 'Actief').map(s => ({
        description: s.name,
        quantity: 1,
        unitPrice: Number(s.price || 0),
        amount: Number(s.price || 0),
      }))
    : [{ description: `Maandelijkse diensten ${month}`, quantity: 1, unitPrice: Number(selected.value.monthlyTotal), amount: Number(selected.value.monthlyTotal) }]
  const nextNum = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${String(invoices.value.length + 1).padStart(3, '0')}`
  Object.assign(invoiceForm, {
    ...emptyInvoiceForm(),
    invoiceNumber: nextNum,
    title: `Maandfactuur ${month}`,
    issueDate: fmt(today),
    dueDate: fmt(due),
    lines,
  })
  invoiceError.value = ''
  showInvoiceModal.value = true
}

function openNewInvoice() {
  editingInvoice.value = null
  Object.assign(invoiceForm, emptyInvoiceForm())
  invoiceError.value = ''
  showInvoiceModal.value = true
}
function openEditInvoice(inv) {
  editingInvoice.value = inv
  Object.assign(invoiceForm, {
    invoiceNumber: inv.invoiceNumber, title: inv.title, status: inv.status,
    issueDate: inv.issueDate ? String(inv.issueDate).slice(0, 10) : '',
    dueDate: inv.dueDate ? String(inv.dueDate).slice(0, 10) : '',
    taxRate: inv.taxRate, notes: inv.notes,
    lines: inv.lines.map((l) => ({ ...l })),
  })
  invoiceError.value = ''
  showInvoiceModal.value = true
}
async function saveInvoice() {
  invoiceError.value = ''
  invoiceSaving.value = true
  try {
    const payload = { ...invoiceForm, dueDate: invoiceForm.dueDate || null }
    if (editingInvoice.value?.id) {
      const updated = await api.put(`/api/admin/invoices/${editingInvoice.value.id}`, payload)
      invoices.value = invoices.value.map((i) => i.id === updated.id ? updated : i)
    } else {
      const created = await api.post(`/api/admin/customers/${selected.value.id}/invoices`, payload)
      invoices.value.unshift(created)
    }
    showInvoiceModal.value = false
  } catch (e) {
    invoiceError.value = e.message
  } finally {
    invoiceSaving.value = false
  }
}
async function deleteInvoice(id) {
  if (!confirm('Factuur verwijderen?')) return
  await api.del(`/api/admin/invoices/${id}`)
  invoices.value = invoices.value.filter((i) => i.id !== id)
}

async function sendPasswordReset() {
  if (!customerLogin.value?.email) return
  loginBusy.value = true
  loginError.value = ''
  try {
    await api.post('/api/auth/forgot-password', { email: customerLogin.value.email })
    admin.toast(`Resetmail verstuurd naar ${customerLogin.value.email}`, 'info')
  } catch (e) {
    loginError.value = e.message
  } finally {
    loginBusy.value = false
  }
}

async function doDeleteLogin() {
  if (!confirm('Login verwijderen? De klant kan dan niet meer inloggen.')) return
  loginBusy.value = true
  try {
    await api.del(`/api/admin/customers/${selected.value.id}/login`)
    customerLogin.value = null
  } catch (e) {
    loginError.value = e.message
  } finally {
    loginBusy.value = false
  }
}
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
  if (!admin.mailTemplates.length) await admin.loadMailTemplates()
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

.extra-section { margin-top: 30px; padding-top: 24px; border-top: 1px solid var(--border); }
.extra-section h3 { font-size: 1.05rem; margin: 0 0 14px; }
.phases-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }

.monitor-row {
  display: flex; align-items: center; gap: 12px; padding: 10px 14px; margin-top: 10px;
  border: 1px solid var(--border); border-radius: var(--radius); background: var(--field-bg);
}
.monitor-row.up { border-color: var(--success-border); background: var(--success-bg); }
.monitor-row.warning { border-color: var(--warning-border); background: var(--warning-bg); }
.monitor-row.error { border-color: var(--danger-border); background: var(--danger-bg); }
.monitor-details { flex: 1; display: flex; flex-direction: column; gap: 1px; }
.monitor-dot-adm {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; background: var(--muted);
}
.monitor-dot-adm.up { background: var(--success); animation: monitor-adm-pulse 2.5s ease-in-out infinite; }
.monitor-dot-adm.warning { background: var(--warning); }
.monitor-dot-adm.error { background: var(--danger); animation: monitor-adm-pulse 1s ease-in-out infinite; }
@keyframes monitor-adm-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }

.quick-invoice-btn { width: 100%; margin-top: 10px; justify-content: center; gap: 7px; display: flex; align-items: center; }
.phase-progress-label { font-size: 0.78rem; font-weight: 400; color: var(--muted); margin-left: 8px; }
.phase-progress-bar { height: 4px; border-radius: 999px; background: var(--border); margin: 0 0 10px; overflow: hidden; }
.phase-progress-fill { height: 100%; border-radius: 999px; background: var(--accent); transition: width 0.4s ease; }
.phase-row {
  display: grid;
  grid-template-columns: 1.5fr 2fr 130px auto;
  gap: 8px; align-items: center;
}
.invoices-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.files-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.file-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--field-bg); }
.file-name { flex: 1; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.invoice-row {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 12px; align-items: center;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--field-bg);
}
.inv-meta { display: flex; flex-direction: column; gap: 2px; }
.inv-actions { display: flex; gap: 6px; }
.tag.inv-open { color: var(--warning); background: var(--warning-bg); border-color: var(--warning-border); }
.tag.inv-concept { color: var(--muted); background: var(--field-bg); }
.tag.inv-verstuurd { color: var(--warning); background: var(--warning-bg); border-color: var(--warning-border); }
.tag.inv-deels_betaald { color: var(--accent-2); background: var(--info-bg); border-color: var(--info-border); }
.tag.inv-betaald { color: var(--success); background: var(--success-bg); border-color: var(--success-border); }
.tag.inv-vervallen { color: var(--danger); background: var(--danger-bg); border-color: var(--danger-border); }
.tag.inv-geannuleerd { color: var(--muted); }
.modal-wide { width: min(780px, 100%); }
.inv-lines-head { display: flex; align-items: center; justify-content: space-between; margin: 18px 0 8px; }
.inv-lines-head h4 { margin: 0; font-size: 0.95rem; }
.inv-lines { display: flex; flex-direction: column; gap: 6px; }
.inv-line-header, .inv-line {
  display: grid;
  grid-template-columns: 2fr 80px 110px 110px auto;
  gap: 8px; align-items: center;
}
.inv-line-header { padding: 0 0 4px; }
.inv-totals {
  display: grid; grid-template-columns: 1fr auto;
  gap: 4px 16px; max-width: 260px; margin: 14px 0 0 auto;
  font-size: 0.92rem;
}
.login-section { margin-top: 30px; padding-top: 24px; border-top: 1px solid var(--border); }
.login-section h3 { font-size: 1.05rem; margin: 0 0 14px; }
.login-info {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius);
  background: var(--field-bg); margin-bottom: 12px;
}
.login-info > div { display: flex; flex-direction: column; gap: 2px; }
.login-create { display: flex; flex-direction: column; gap: 12px; margin-top: 10px; }
.login-reset { display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px; }
.login-actions { display: flex; gap: 8px; flex-wrap: wrap; }
.mail-section { margin-top: 30px; padding-top: 24px; border-top: 1px solid var(--border); }
.mail-section h3 { font-size: 1.05rem; margin: 0 0 14px; }
.mail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
.json-area { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.86rem; }
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
  .mail-grid { grid-template-columns: 1fr; }
  .svc { grid-template-columns: 1fr 1fr; }
  .svc > :nth-child(5) { grid-column: span 2; justify-self: end; }
}
</style>
