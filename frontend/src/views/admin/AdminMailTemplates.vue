<template>
  <div>
    <header class="head">
      <div>
        <h1>Mail templates</h1>
        <p class="muted">Beheer standaardmails en gebruik variabelen zoals {naam}, {bedrijf} en {login_url}.</p>
      </div>
      <button class="btn btn-ghost" @click="load">Verversen</button>
    </header>

    <div class="layout">
      <aside class="template-list">
        <button
          v-for="template in admin.mailTemplates"
          :key="template.id"
          class="template-item"
          :class="{ active: selected?.id === template.id }"
          type="button"
          @click="select(template)"
        >
          <strong>{{ template.name }}</strong>
          <small>{{ template.key }} · {{ template.enabled ? 'actief' : 'uit' }}</small>
        </button>
      </aside>

      <section v-if="selected" class="editor">
        <div class="grid grid-2">
          <div>
            <label class="label">Naam</label>
            <input v-model="selected.name" class="input" @input="queueTemplate" />
          </div>
          <div>
            <label class="label">Template sleutel</label>
            <input :value="selected.key" class="input" disabled />
          </div>
        </div>

        <label class="label mt">Onderwerp</label>
        <input v-model="selected.subject" class="input" @input="queueTemplate" />

        <label class="label mt">Variabelen</label>
        <input v-model="variableText" class="input" placeholder="naam, bedrijf, login_url" @input="updateVariables" />
        <div class="chips">
          <button v-for="variable in availableVariables" :key="variable" type="button" @click="insertVariable(variable)">
            {{ variableToken(variable) }}
          </button>
        </div>

        <label class="label mt">Mail inhoud</label>
        <RichTextEditor v-model="selected.body" @update:modelValue="queueTemplate" />

        <label class="toggle mt">
          <input type="checkbox" v-model="selected.enabled" @change="queueTemplate" />
          <span></span>
          Template actief
        </label>

        <div class="actions">
          <button class="btn btn-primary" @click="save" :disabled="saving">{{ saving ? 'Opslaan...' : 'Nu opslaan' }}</button>
          <span v-if="savingKey === selected.id" class="muted small">Autosave...</span>
        </div>
        <p v-if="savedAt" class="muted small">Laatst automatisch opgeslagen om {{ savedAt }}.</p>
        <p v-if="error" class="error">Autosave fout: {{ error }}</p>

        <section class="send-box">
          <h2>Template testen / verzenden</h2>
          <div class="grid grid-2">
            <div>
              <label class="label">Ontvanger</label>
              <input v-model="sendTo" type="email" class="input" placeholder="klant@example.nl" />
            </div>
            <div>
              <label class="label">Variabelen als JSON</label>
              <textarea v-model="sendVariables" class="textarea json-area" rows="4"></textarea>
            </div>
          </div>
          <button class="btn btn-ghost" @click="sendTemplate" :disabled="sending">{{ sending ? 'Versturen...' : 'Verstuur mail' }}</button>
          <p v-if="sendStatus" class="muted small">{{ sendStatus }}</p>
          <p v-if="sendError" class="error">{{ sendError }}</p>
        </section>
      </section>

      <section v-else class="editor empty muted">Selecteer een template.</section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue'
import { useAdminStore } from '../../stores/admin'
import RichTextEditor from '../../components/admin/RichTextEditor.vue'
import { useAutosave } from '../../composables/autosave'

const admin = useAdminStore()
const selected = ref(null)
const availableVariables = ref([])
const variableText = ref('')
const saving = ref(false)
const sending = ref(false)
const sendTo = ref('')
const sendStatus = ref('')
const sendError = ref('')
const sendVariables = ref(JSON.stringify({
  naam: 'Test klant',
  bedrijf: 'TD Development',
  login_url: `${window.location.origin}/login`,
  reset_url: `${window.location.origin}/login`,
  project: 'Website',
  bericht: 'Dit is een testbericht.',
}, null, 2))
const { savingKey, savedAt, error, queue, flush } = useAutosave((template) => admin.updateMailTemplate(template))

const currentVariables = computed(() => variableText.value.split(',').map((v) => v.trim()).filter(Boolean))

onMounted(load)

async function load() {
  const r = await admin.loadMailTemplates()
  availableVariables.value = r.variables || []
  if (!selected.value && admin.mailTemplates.length) select(admin.mailTemplates[0])
}

function select(template) {
  selected.value = JSON.parse(JSON.stringify(template))
  variableText.value = (selected.value.variables || []).join(', ')
  sendStatus.value = ''
  sendError.value = ''
}

function updateVariables() {
  if (!selected.value) return
  selected.value.variables = currentVariables.value
  queueTemplate()
}

function insertVariable(variable) {
  if (!selected.value) return
  selected.value.body = `${selected.value.body || ''} {${variable}}`
  if (!currentVariables.value.includes(variable)) {
    selected.value.variables = [...currentVariables.value, variable]
    variableText.value = selected.value.variables.join(', ')
  }
  queueTemplate()
}

function variableToken(variable) {
  return `{${variable}}`
}

function queueTemplate() {
  if (!selected.value) return
  nextTick(() => queue(selected.value.id, { ...selected.value, variables: currentVariables.value }))
}

async function save() {
  if (!selected.value) return
  saving.value = true
  try {
    const saved = await flush(selected.value.id, { ...selected.value, variables: currentVariables.value })
    select(saved)
  } finally {
    saving.value = false
  }
}

async function sendTemplate() {
  if (!selected.value) return
  sending.value = true
  sendStatus.value = ''
  sendError.value = ''
  try {
    let variables = {}
    try { variables = JSON.parse(sendVariables.value || '{}') }
    catch { throw new Error('Variabelen moeten geldige JSON zijn.') }
    await admin.sendMailTemplate(selected.value.id, { to: sendTo.value, variables })
    sendStatus.value = 'Mail verzonden.'
  } catch (e) {
    sendError.value = e.message
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 20px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
.template-list,
.editor {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 18px;
}
.template-list { display: flex; flex-direction: column; gap: 8px; }
.template-item {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  text-align: left;
}
.template-item.active {
  border-color: var(--border-strong);
  background: var(--accent-dim);
}
.template-item small { color: var(--muted); }
.mt { margin-top: 14px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.chips button {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--field-bg);
  color: var(--text);
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--text);
  font-size: 0.88rem;
}
.toggle input { width: 18px; height: 18px; }
.actions { display: flex; gap: 10px; align-items: center; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
.send-box { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border); }
.send-box h2 { font-size: 1.1rem; }
.json-area { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 0.86rem; }
.empty { padding: 60px; text-align: center; }
.error { color: var(--danger); }
@media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
</style>
