<template>
  <div>
    <header class="head">
      <div>
        <h1>Pakketten</h1>
        <p class="muted">Prijzen die op de homepage staan. Vink per pakket aan welke wensen er inbegrepen zijn — die worden automatisch aangevinkt in de offerte-configurator.</p>
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

        <div class="wishes-section">
          <label class="label">Inbegrepen wensen <span class="muted small">(worden automatisch aangevinkt in de offerte)</span></label>
          <div class="wishes-grid">
            <label
              v-for="w in allWishes"
              :key="w.id"
              class="wish-check"
              :class="{ active: (p.wishIds || []).includes(w.id) }"
            >
              <input
                type="checkbox"
                :checked="(p.wishIds || []).includes(w.id)"
                @change="toggleWish(p, w.id)"
              />
              <span class="wish-icon">{{ w.icon }}</span>
              {{ w.label }}
              <span v-if="w.priceMin" class="wish-price muted small">+€{{ w.priceMin }}</span>
            </label>
          </div>
        </div>

        <div class="actions">
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
import { computed, nextTick, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useSiteStore } from '../../stores/site'
import { useAutosave } from '../../composables/autosave'
import { DEFAULT_QUOTE_CONFIG } from '../../stores/offerte'

const admin = useAdminStore()
const site = useSiteStore()
const { savingKey, savedAt, error, queue } = useAutosave((pkg) => admin.updatePackage(pkg))

const allWishes = computed(() => {
  const cfg = site.settings?.quoteConfig
  const wishes = Array.isArray(cfg?.wishes) && cfg.wishes.length ? cfg.wishes : DEFAULT_QUOTE_CONFIG.wishes
  return wishes
})

onMounted(() => admin.load())

async function add() {
  await admin.createPackage({
    name: 'Nieuw pakket', price: 0, period: 'eenmalig', description: '', features: '',
    ctaLabel: 'Vraag offerte aan', ctaUrl: '/contact',
    highlighted: false, enabled: true, sortOrder: admin.packages.length + 1,
    wishIds: [],
  })
}

function toggleWish(pkg, wishId) {
  if (!Array.isArray(pkg.wishIds)) pkg.wishIds = []
  const idx = pkg.wishIds.indexOf(wishId)
  if (idx === -1) pkg.wishIds.push(wishId)
  else pkg.wishIds.splice(idx, 1)
  queueSave(pkg)
}

function queueSave(pkg) { nextTick(() => queue(pkg.id, { ...pkg })) }
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

.wishes-section { margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); }
.wishes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.wish-check {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--field-bg);
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.wish-check input { display: none; }
.wish-check:hover { border-color: var(--accent-2); color: var(--text); }
.wish-check.active {
  border-color: var(--accent);
  background: var(--accent-dim);
  color: var(--text);
}
.wish-icon {
  font-size: 0.7rem;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--accent-2);
}
.wish-check.active .wish-icon {
  background: color-mix(in srgb, var(--accent) 18%, transparent);
  color: var(--accent);
}
.wish-price { margin-left: 2px; }
</style>
