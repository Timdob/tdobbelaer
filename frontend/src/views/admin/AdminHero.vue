<template>
  <div>
    <header class="head">
      <div>
        <h1>Homepage hero</h1>
        <p class="muted">Beheer de grote hero bovenaan de homepage. De eerste zichtbare slide wordt getoond.</p>
      </div>
      <button class="btn btn-primary" @click="add">+ Slide toevoegen</button>
    </header>

    <div class="list">
      <article v-for="slide in admin.heroSlides" :key="slide.id" class="card">
        <div class="grid grid-2">
          <div>
            <label class="label">Titel</label>
            <input v-model="slide.title" class="input" @input="queueSave(slide)" />
            <label class="label mt">Subtitel</label>
            <textarea v-model="slide.subtitle" class="textarea" @input="queueSave(slide)"></textarea>
            <div class="grid grid-2 mt">
              <div><label class="label">CTA tekst</label><input v-model="slide.ctaLabel" class="input" @input="queueSave(slide)" /></div>
              <div><label class="label">CTA URL</label><input v-model="slide.ctaUrl" class="input" @input="queueSave(slide)" /></div>
            </div>
            <label class="label mt">Terminal tekst</label>
            <textarea
              v-model="slide.terminalText"
              class="textarea terminal-input"
              placeholder="Elke regel komt als getypte matrix-regel in het scherm."
              @input="queueSave(slide)"
            ></textarea>
            <div class="grid grid-2 mt">
              <div><label class="label">Volgorde</label><input v-model.number="slide.sortOrder" type="number" class="input" @input="queueSave(slide)" /></div>
              <div class="check">
                <label><input type="checkbox" v-model="slide.enabled" @change="queueSave(slide)" /> Zichtbaar</label>
              </div>
            </div>
          </div>
          <div>
            <label class="label">Afbeelding (optioneel)</label>
            <ImageUpload v-model="slide.imageUrl" @update:modelValue="queueSave(slide)" />
          </div>
        </div>
        <div class="actions">
          <button class="btn" @click="save(slide)" :disabled="busy === slide.id">
            {{ busy === slide.id ? 'Opslaan...' : 'Nu opslaan' }}
          </button>
          <button class="btn btn-ghost danger" @click="remove(slide.id)">Verwijderen</button>
          <span v-if="savingKey === slide.id" class="muted small">Autosave...</span>
        </div>
      </article>

      <p v-if="!admin.heroSlides.length" class="muted">Nog geen slides. Klik op toevoegen.</p>
      <p v-if="savedAt" class="muted small">Laatst automatisch opgeslagen om {{ savedAt }}.</p>
      <p v-if="error" class="error">Autosave fout: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import ImageUpload from '../../components/admin/ImageUpload.vue'
import { useAutosave } from '../../composables/autosave'

const admin = useAdminStore()
const busy = ref(null)
const { savingKey, savedAt, error, queue, flush } = useAutosave((slide) => admin.updateSlide(slide))

onMounted(() => admin.load())

async function add() {
  await admin.createSlide({
    title: 'Nieuwe slide', subtitle: 'Beschrijving',
    terminalText: '> boot td-development.nl\n> sync admin_content --live\n> status: online',
    enabled: true, sortOrder: admin.heroSlides.length + 1,
  })
}
function queueSave(slide) { nextTick(() => queue(slide.id, { ...slide })) }
async function save(s) { busy.value = s.id; try { await flush(s.id, { ...s }) } finally { busy.value = null } }
async function remove(id) { if (confirm('Slide verwijderen?')) await admin.deleteSlide(id) }
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 20px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.list { display: flex; flex-direction: column; gap: 18px; }
.mt { margin-top: 14px; }
.actions { display: flex; gap: 10px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
.danger { color: var(--danger); border-color: var(--danger-border); }
.danger:hover { background: var(--danger-bg); }
.check label { display: flex; align-items: center; gap: 8px; padding-top: 28px; cursor: pointer; }
.terminal-input {
  min-height: 138px;
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
}
.error { color: var(--danger); }
</style>
