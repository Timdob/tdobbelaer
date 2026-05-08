<template>
  <div>
    <header class="head">
      <div>
        <h1>Pakketten</h1>
        <p class="muted">Prijzen die op de homepage staan.</p>
      </div>
      <button class="btn btn-primary" @click="add">+ Pakket toevoegen</button>
    </header>

    <div class="list">
      <article v-for="p in admin.packages" :key="p.id" class="card">
        <div class="grid grid-2">
          <div>
            <label class="label">Naam</label>
            <input v-model="p.name" class="input" @input="queueSave(p)" />
            <label class="label mt">Beschrijving</label>
            <textarea v-model="p.description" class="textarea" rows="2" @input="queueSave(p)"></textarea>
            <label class="label mt">Features (1 per regel)</label>
            <textarea v-model="p.features" class="textarea" rows="6" @input="queueSave(p)"></textarea>
          </div>
          <div>
            <div class="grid grid-2">
              <div><label class="label">Prijs (€)</label><input v-model.number="p.price" type="number" min="0" step="0.01" class="input" @input="queueSave(p)" /></div>
              <div><label class="label">Periode</label><input v-model="p.period" class="input" @input="queueSave(p)" /></div>
            </div>
            <div class="grid grid-2 mt">
              <div><label class="label">CTA tekst</label><input v-model="p.ctaLabel" class="input" @input="queueSave(p)" /></div>
              <div><label class="label">CTA URL</label><input v-model="p.ctaUrl" class="input" @input="queueSave(p)" /></div>
            </div>
            <div class="grid grid-2 mt">
              <div><label class="label">Volgorde</label><input v-model.number="p.sortOrder" type="number" class="input" @input="queueSave(p)" /></div>
              <div class="checks">
                <label><input type="checkbox" v-model="p.highlighted" @change="queueSave(p)" /> Uitgelicht</label>
                <label><input type="checkbox" v-model="p.enabled" @change="queueSave(p)" /> Zichtbaar</label>
              </div>
            </div>
          </div>
        </div>
        <div class="actions">
          <button class="btn" @click="save(p)" :disabled="busy === p.id">
            {{ busy === p.id ? 'Opslaan...' : 'Nu opslaan' }}
          </button>
          <button class="btn btn-ghost danger" @click="remove(p.id)">Verwijderen</button>
          <span v-if="savingKey === p.id" class="muted small">Autosave...</span>
        </div>
      </article>
      <p v-if="!admin.packages.length" class="muted">Nog geen pakketten.</p>
      <p v-if="savedAt" class="muted small">Laatst automatisch opgeslagen om {{ savedAt }}.</p>
      <p v-if="error" class="error">Autosave fout: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useAutosave } from '../../composables/autosave'

const admin = useAdminStore()
const busy = ref(null)
const { savingKey, savedAt, error, queue, flush } = useAutosave((pkg) => admin.updatePackage(pkg))

onMounted(() => admin.load())

async function add() {
  await admin.createPackage({
    name: 'Nieuw pakket', price: 0, period: 'eenmalig', description: '', features: '',
    ctaLabel: 'Vraag offerte aan', ctaUrl: '/contact',
    highlighted: false, enabled: true, sortOrder: admin.packages.length + 1,
  })
}
function queueSave(pkg) { nextTick(() => queue(pkg.id, { ...pkg })) }
async function save(p) { busy.value = p.id; try { await flush(p.id, { ...p }) } finally { busy.value = null } }
async function remove(id) { if (confirm('Pakket verwijderen?')) await admin.deletePackage(id) }
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 20px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.list { display: flex; flex-direction: column; gap: 18px; }
.mt { margin-top: 14px; }
.actions { display: flex; gap: 10px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
.checks { display: flex; flex-direction: column; gap: 8px; padding-top: 24px; }
.checks label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; }
.danger { color: var(--danger); border-color: var(--danger-border); }
.danger:hover { background: var(--danger-bg); }
.error { color: var(--danger); }
</style>
