<template>
  <div>
    <header class="head">
      <div>
        <h1>Extra diensten</h1>
        <p class="muted">Losse diensten die klanten in het portaal aan hun bestaande pakket kunnen toevoegen.</p>
      </div>
      <button class="btn btn-primary" type="button" @click="add">+ Dienst toevoegen</button>
    </header>

    <div class="list">
      <article v-for="item in sortedAddons" :key="item.id" class="card">
        <div class="grid grid-2">
          <div>
            <label class="label">Naam</label>
            <input v-model="item.name" class="input" @input="queueSave(item)" />

            <label class="label mt">Beschrijving</label>
            <textarea v-model="item.description" class="textarea" rows="3" @input="queueSave(item)"></textarea>

            <label class="label mt">Kenmerken (1 per regel)</label>
            <textarea v-model="item.featuresText" class="textarea" rows="5" @input="onFeaturesInput(item)"></textarea>
          </div>

          <div>
            <div class="grid grid-2">
              <div>
                <label class="label">Prijs (€)</label>
                <input v-model.number="item.price" type="number" min="0" step="0.01" class="input" @input="queueSave(item)" />
              </div>
              <div>
                <label class="label">Periode</label>
                <input v-model="item.period" class="input" placeholder="maand" @input="queueSave(item)" />
              </div>
            </div>

            <div class="grid grid-2 mt">
              <div>
                <label class="label">Slug</label>
                <input v-model="item.key" class="input" @input="queueSave(item)" />
              </div>
              <div>
                <label class="label">Volgorde</label>
                <input v-model.number="item.sortOrder" type="number" class="input" @input="queueSave(item)" />
              </div>
            </div>

            <label class="check mt">
              <input type="checkbox" v-model="item.enabled" @change="queueSave(item)" />
              Zichtbaar in klantportaal
            </label>
          </div>
        </div>

        <div class="actions">
          <button class="btn btn-ghost danger" type="button" @click="remove(item.id)">Verwijderen</button>
          <span v-if="savingKey === item.id" class="muted small">Autosave...</span>
        </div>
      </article>

      <p v-if="!admin.serviceAddons.length" class="muted">Nog geen extra diensten.</p>
      <p v-if="savedAt" class="muted small">Laatst automatisch opgeslagen om {{ savedAt }}.</p>
      <p v-if="error" class="error">Autosave fout: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useAutosave } from '../../composables/autosave'

const admin = useAdminStore()
const { savingKey, savedAt, error, queue } = useAutosave((item) => admin.updateServiceAddon(serialize(item)))

const sortedAddons = computed(() => {
  return [...admin.serviceAddons]
    .map(prepare)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || Number(a.id) - Number(b.id))
})

onMounted(() => admin.load())

async function add() {
  const created = await admin.createServiceAddon({
    key: `extra-dienst-${admin.serviceAddons.length + 1}`,
    name: 'Nieuwe extra dienst',
    price: 0,
    period: 'maand',
    description: '',
    features: [],
    enabled: true,
    sortOrder: admin.serviceAddons.length + 1,
  })
  prepare(created)
}

function prepare(item) {
  if (item.featuresText === undefined) {
    item.featuresText = Array.isArray(item.features) ? item.features.join('\n') : ''
  }
  return item
}

function serialize(item) {
  return {
    ...item,
    features: String(item.featuresText || '').split('\n').map((f) => f.trim()).filter(Boolean),
  }
}

function onFeaturesInput(item) {
  item.features = String(item.featuresText || '').split('\n').map((f) => f.trim()).filter(Boolean)
  queueSave(item)
}

function queueSave(item) {
  nextTick(() => queue(item.id, serialize(item)))
}

async function remove(id) {
  if (confirm('Extra dienst verwijderen?')) await admin.deleteServiceAddon(id)
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 20px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.list { display: flex; flex-direction: column; gap: 18px; }
.mt { margin-top: 14px; }
.check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; }
.actions { display: flex; gap: 10px; margin-top: 18px; padding-top: 18px; border-top: 1px solid var(--border); }
.danger { color: var(--danger); border-color: var(--danger-border); }
.danger:hover { background: var(--danger-bg); }
.error { color: var(--danger); }
@media (max-width: 760px) {
  .head { align-items: stretch; flex-direction: column; }
}
</style>
