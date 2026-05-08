<template>
  <div class="quote-admin">
    <header class="head">
      <div>
        <h1>Offerte builder</h1>
        <p class="muted">Beheer alle stappen, opties en extra vragen van de offerte-configurator.</p>
      </div>
      <button class="btn btn-primary" :disabled="saving" @click="save">
        {{ saving ? 'Opslaan...' : 'Configuratie opslaan' }}
      </button>
    </header>

    <section class="panel">
      <h2>Stapteksten</h2>
      <div class="steps-grid">
        <article v-for="(step, index) in config.steps" :key="step.key" class="mini-panel">
          <span class="eyebrow">Stap {{ index + 1 }}</span>
          <label class="label">Tab label</label>
          <input v-model="step.label" class="input" />
          <label class="label mt">Eyebrow</label>
          <input v-model="step.eyebrow" class="input" />
          <label class="label mt">Titel</label>
          <input v-model="step.title" class="input" />
          <label class="label mt">Uitleg</label>
          <textarea v-model="step.lead" class="textarea" rows="3"></textarea>
        </article>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Stap 1: branches</h2>
        <button class="btn btn-ghost" @click="addBranch">Branche toevoegen</button>
      </div>
      <div class="option-list">
        <div v-for="(item, index) in config.branches" :key="item.id" class="option-row">
          <input v-model="item.icon" class="input small-input" placeholder="Icon" />
          <input v-model="item.id" class="input" placeholder="id" />
          <input v-model="item.label" class="input" placeholder="Label" />
          <button class="btn btn-ghost danger" @click="remove(config.branches, index)">Verwijder</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Stap 2: wensen</h2>
        <button class="btn btn-ghost" @click="addWish">Wens toevoegen</button>
      </div>
      <div class="option-list">
        <div v-for="(item, index) in config.wishes" :key="item.id" class="option-row">
          <input v-model="item.icon" class="input small-input" placeholder="Icon" />
          <input v-model="item.id" class="input" placeholder="id" />
          <input v-model="item.label" class="input" placeholder="Label" />
          <button class="btn btn-ghost danger" @click="remove(config.wishes, index)">Verwijder</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <h2>Stap 3: veldlabels</h2>
      <div class="grid grid-2">
        <div v-for="(_, key) in config.fields" :key="key">
          <label class="label">{{ key }}</label>
          <input v-model="config.fields[key]" class="input" />
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Live-opties</h2>
        <button class="btn btn-ghost" @click="config.liveOptions.push('Nieuwe optie')">Optie toevoegen</button>
      </div>
      <div class="option-list compact-list">
        <div v-for="(_, index) in config.liveOptions" :key="index" class="option-row compact-row">
          <input v-model="config.liveOptions[index]" class="input" />
          <button class="btn btn-ghost danger" @click="remove(config.liveOptions, index)">Verwijder</button>
        </div>
      </div>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2>Extra vragen</h2>
        <button class="btn btn-ghost" @click="addQuestion">Vraag toevoegen</button>
      </div>
      <div class="question-list">
        <article v-for="(question, index) in config.extraQuestions" :key="question.id" class="mini-panel">
          <div class="question-head">
            <strong>Vraag {{ index + 1 }}</strong>
            <button class="btn btn-ghost danger" @click="remove(config.extraQuestions, index)">Verwijder</button>
          </div>
          <div class="grid grid-2">
            <div>
              <label class="label">ID</label>
              <input v-model="question.id" class="input" />
            </div>
            <div>
              <label class="label">Label</label>
              <input v-model="question.label" class="input" />
            </div>
            <div>
              <label class="label">Type</label>
              <select v-model="question.type" class="select">
                <option value="text">Tekst</option>
                <option value="textarea">Grote tekst</option>
                <option value="select">Keuzelijst</option>
              </select>
            </div>
            <label class="check">
              <input type="checkbox" v-model="question.required" />
              Verplicht
            </label>
          </div>
          <label v-if="question.type === 'select'" class="label mt">Opties, 1 per regel</label>
          <textarea
            v-if="question.type === 'select'"
            :value="(question.options || []).join('\n')"
            class="textarea"
            rows="4"
            @input="question.options = $event.target.value.split('\n').map((v) => v.trim()).filter(Boolean)"
          ></textarea>
        </article>
        <p v-if="!config.extraQuestions.length" class="muted">Nog geen extra vragen.</p>
      </div>
    </section>

    <p v-if="saved" class="status">Opgeslagen.</p>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { DEFAULT_QUOTE_CONFIG } from '../../stores/offerte'

const admin = useAdminStore()
const saving = ref(false)
const saved = ref(false)
const error = ref('')
const config = reactive(clone(DEFAULT_QUOTE_CONFIG))

onMounted(async () => {
  await admin.loadAll()
  Object.assign(config, merge(admin.settings?.quoteConfig))
})

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function merge(value = {}) {
  const merged = clone(DEFAULT_QUOTE_CONFIG)
  Object.assign(merged, value || {})
  merged.steps = DEFAULT_QUOTE_CONFIG.steps.map((step, index) => ({ ...step, ...(value?.steps?.[index] || {}) }))
  merged.fields = { ...DEFAULT_QUOTE_CONFIG.fields, ...(value?.fields || {}) }
  merged.branches = Array.isArray(value?.branches) && value.branches.length ? value.branches : merged.branches
  merged.wishes = Array.isArray(value?.wishes) && value.wishes.length ? value.wishes : merged.wishes
  merged.liveOptions = Array.isArray(value?.liveOptions) && value.liveOptions.length ? value.liveOptions : merged.liveOptions
  merged.extraQuestions = Array.isArray(value?.extraQuestions) ? value.extraQuestions : []
  return merged
}

function addBranch() {
  config.branches.push({ id: `branche-${Date.now()}`, icon: 'NW', label: 'Nieuwe branche' })
}

function addWish() {
  config.wishes.push({ id: `wens-${Date.now()}`, icon: 'NW', label: 'Nieuwe wens' })
}

function addQuestion() {
  config.extraQuestions.push({
    id: `vraag-${Date.now()}`,
    label: 'Nieuwe vraag',
    type: 'text',
    required: false,
    options: [],
  })
}

function remove(list, index) {
  list.splice(index, 1)
}

async function save() {
  saving.value = true
  saved.value = false
  error.value = ''
  try {
    await admin.saveQuoteConfig(clone(config))
    saved.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.head,
.panel-head,
.question-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
}
.head { margin-bottom: 24px; }
.head h1 { margin-bottom: 4px; }
.panel {
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 72%, transparent);
}
.panel + .panel,
.status,
.error { margin-top: 18px; }
.panel h2 { margin: 0 0 16px; font-size: 1.2rem; }
.steps-grid,
.question-list {
  display: grid;
  gap: 16px;
}
.steps-grid { grid-template-columns: repeat(3, 1fr); }
.mini-panel {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--field-bg);
}
.option-list {
  display: grid;
  gap: 10px;
}
.option-row {
  display: grid;
  grid-template-columns: 90px 1fr 1.3fr auto;
  gap: 10px;
  align-items: center;
}
.compact-row { grid-template-columns: 1fr auto; }
.small-input { text-transform: uppercase; }
.mt { margin-top: 14px; }
.check {
  display: flex;
  align-items: center;
  gap: 9px;
  padding-top: 28px;
}
.danger { color: var(--danger); border-color: var(--danger-border); }
.status {
  color: var(--accent-2);
}
.error {
  color: var(--danger);
}
@media (max-width: 1000px) {
  .steps-grid,
  .option-row,
  .compact-row { grid-template-columns: 1fr; }
}
</style>
