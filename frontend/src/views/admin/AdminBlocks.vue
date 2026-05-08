<template>
  <div>
    <header class="head">
      <div>
        <h1>Homepage blokken</h1>
        <p class="muted">Bouw je homepage. Sleep blokken om de volgorde te veranderen, kies een breedte zodat blokken naast elkaar kunnen.</p>
      </div>
      <button class="btn btn-primary" @click="add">+ Blok toevoegen</button>
    </header>

    <div class="list">
      <article
        v-for="b in sortedBlocks"
        :key="b.id"
        class="card block-card"
        :class="{ dragging: dragId === b.id, 'drag-over': dragOverId === b.id }"
        :draggable="!isEditing"
        @dragstart="onDragStart(b, $event)"
        @dragover.prevent="onDragOver(b)"
        @dragleave="onDragLeave(b)"
        @drop="onDrop(b, $event)"
        @dragend="onDragEnd"
      >
        <div class="block-head">
          <span class="drag-handle" aria-label="Sleep om volgorde te wijzigen" title="Sleep">⋮⋮</span>
          <div class="head-info">
            <span class="type-pill">{{ typeLabel(b.type) }}</span>
            <strong class="block-title">{{ b.title || '(zonder titel)' }}</strong>
            <span v-if="!b.enabled" class="hidden-pill">Verborgen</span>
          </div>
          <div class="head-meta">
            <span class="muted small">Breedte: {{ widthLabel(b.width) }}</span>
            <button class="icon-btn" type="button" @click="toggleExpand(b.id)" :aria-expanded="isExpanded(b.id)" :aria-label="isExpanded(b.id) ? 'Inklappen' : 'Uitklappen'">
              <svg viewBox="0 0 24 24" :class="{ rotated: isExpanded(b.id) }"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>

        <div v-if="isExpanded(b.id)" class="block-body" @focusin="isEditing = true" @focusout="isEditing = false">
          <div class="grid grid-3">
            <div>
              <label class="label">Type</label>
              <select v-model="b.type" class="select" @change="onTypeChange(b)">
                <option v-for="t in typeOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
            </div>
            <div>
              <label class="label">Breedte</label>
              <select v-model="b.width" class="select" @change="queueSave(b)">
                <option value="full">Volledig (12 kolommen)</option>
                <option value="twoThird">Twee derde (8/12)</option>
                <option value="half">Halve breedte (6/12)</option>
                <option value="third">Een derde (4/12)</option>
              </select>
            </div>
            <div>
              <label class="label">Stijl</label>
              <select v-model="b.variant" class="select" @change="queueSave(b)">
                <option v-for="v in variantOptions(b.type)" :key="v.value" :value="v.value">{{ v.label }}</option>
              </select>
            </div>
          </div>

          <!-- Common header fields (most types) -->
          <div v-if="usesHeader(b.type)" class="grid grid-2 mt">
            <div>
              <label class="label">Eyebrow / subtitel</label>
              <input v-model="b.subtitle" class="input" @input="queueSave(b)" />
            </div>
            <div>
              <label class="label">Titel</label>
              <input v-model="b.title" class="input" @input="queueSave(b)" />
            </div>
          </div>

          <!-- Body field -->
          <template v-if="usesBody(b.type)">
            <label class="label mt">{{ b.type === 'offerte' ? 'Intro tekst (HTML toegestaan)' : 'Tekst (HTML toegestaan)' }}</label>
            <textarea v-model="b.body" class="textarea" rows="4" @input="queueSave(b)"></textarea>
          </template>

          <!-- Image (image-text and feature) -->
          <template v-if="usesImage(b.type)">
            <label class="label mt">Afbeelding</label>
            <ImageUpload v-model="b.imageUrl" @update:modelValue="queueSave(b)" />
          </template>

          <!-- CTA fields -->
          <div v-if="usesCta(b.type)" class="grid grid-2 mt">
            <div>
              <label class="label">CTA tekst</label>
              <input v-model="b.ctaLabel" class="input" @input="queueSave(b)" />
            </div>
            <div>
              <label class="label">CTA URL</label>
              <input v-model="b.ctaUrl" class="input" @input="queueSave(b)" placeholder="/contact" />
            </div>
          </div>

          <!-- ITEMS editors per type -->
          <div v-if="usesItems(b.type)" class="items-section">
            <div class="items-head">
              <h3>{{ itemsLabel(b.type) }}</h3>
              <button class="btn btn-ghost btn-sm" type="button" @click="addItem(b)">+ {{ itemsSingularLabel(b.type) }}</button>
            </div>

            <div class="items-list">
              <div v-for="(item, idx) in b.items" :key="idx" class="item-row" :class="`item-${b.type}`">
                <span class="item-num">{{ idx + 1 }}</span>

                <!-- BENEFITS -->
                <template v-if="b.type === 'benefits'">
                  <select v-model="item.iconKey" class="select item-icon" @change="queueSave(b)">
                    <option value="fast">⚡ Snelheid</option>
                    <option value="live">📡 Realtime</option>
                    <option value="safe">🛡 Veilig</option>
                    <option value="resp">📱 Responsive</option>
                  </select>
                  <input v-model="item.title" class="input" placeholder="Titel" @input="queueSave(b)" />
                  <input v-model="item.text" class="input" placeholder="Beschrijving" @input="queueSave(b)" />
                </template>

                <!-- PROCESS -->
                <template v-else-if="b.type === 'process'">
                  <select v-model="item.iconKey" class="select item-icon" @change="queueSave(b)">
                    <option value="chat">💬 Gesprek</option>
                    <option value="code">⌨ Code</option>
                    <option value="check">✓ Check</option>
                    <option value="launch">🚀 Launch</option>
                    <option value="star">★ Ster</option>
                    <option value="heart">♥ Hart</option>
                  </select>
                  <input v-model="item.title" class="input" placeholder="Stap titel" @input="queueSave(b)" />
                  <input v-model="item.text" class="input" placeholder="Beschrijving" @input="queueSave(b)" />
                </template>

                <!-- PROJECTS -->
                <template v-else-if="b.type === 'projects'">
                  <select v-model="item.variant" class="select item-icon" @change="queueSave(b)">
                    <option value="chat">Chat mockup</option>
                    <option value="admin">Admin mockup</option>
                    <option value="shop">Shop mockup</option>
                  </select>
                  <input v-model="item.title" class="input" placeholder="Project titel" @input="queueSave(b)" />
                  <input v-model="item.text" class="input" placeholder="Korte beschrijving" @input="queueSave(b)" />
                  <input v-model="item.tagsString" class="input" placeholder="tags, gescheiden, met, komma's" @input="onProjectTagsInput(b, item)" />
                </template>

                <!-- STATS -->
                <template v-else-if="b.type === 'stats'">
                  <input v-model="item.value" class="input item-icon" placeholder="100+" @input="queueSave(b)" />
                  <input v-model="item.label" class="input" placeholder="Klanten" @input="queueSave(b)" />
                  <input v-model="item.text" class="input" placeholder="Optionele toelichting" @input="queueSave(b)" />
                </template>

                <!-- LOGOS -->
                <template v-else-if="b.type === 'logos'">
                  <div class="logo-upload"><ImageUpload v-model="item.imageUrl" @update:modelValue="queueSave(b)" /></div>
                  <input v-model="item.label" class="input" placeholder="Naam (alt-text)" @input="queueSave(b)" />
                  <input v-model="item.url" class="input" placeholder="https://... (optioneel)" @input="queueSave(b)" />
                </template>

                <!-- FAQ -->
                <template v-else-if="b.type === 'faq'">
                  <input v-model="item.question" class="input faq-q" placeholder="Vraag" @input="queueSave(b)" />
                  <textarea v-model="item.answer" class="textarea faq-a" rows="3" placeholder="Antwoord (HTML toegestaan)" @input="queueSave(b)"></textarea>
                </template>

                <button class="btn btn-ghost danger item-del" type="button" @click="removeItem(b, idx)" aria-label="Verwijder">×</button>
              </div>
              <p v-if="!b.items?.length" class="muted small">Nog geen items.</p>
            </div>
          </div>

          <!-- Info note for special types -->
          <p v-if="b.type === 'packages'" class="info-note">
            Dit blok rendert je <router-link to="/admin/packages">pakketten</router-link>. De inhoud beheer je via die pagina.
          </p>
          <p v-if="b.type === 'offerte'" class="info-note">
            Dit blok toont de offerte-configurator. Branches en wensen beheer je via <router-link to="/admin/quote">Offerte builder</router-link>.
          </p>

          <div class="grid grid-2 mt">
            <div>
              <label class="label">Volgorde</label>
              <input v-model.number="b.sortOrder" type="number" class="input" @input="queueSave(b)" />
            </div>
            <div class="check">
              <label><input type="checkbox" v-model="b.enabled" @change="queueSave(b)" /> Zichtbaar op homepage</label>
            </div>
          </div>

          <div class="actions">
            <button class="btn" @click="save(b)" :disabled="busy === b.id">
              {{ busy === b.id ? 'Opslaan...' : 'Nu opslaan' }}
            </button>
            <button class="btn btn-ghost danger" @click="remove(b.id)">Verwijderen</button>
            <span v-if="savingKey === b.id" class="muted small">Autosave...</span>
          </div>
        </div>
      </article>

      <p v-if="!admin.blocks.length" class="muted empty">Nog geen blokken. Klik op "Blok toevoegen" om te beginnen.</p>
      <p v-if="savedAt && !error" class="muted small status-row">Laatst automatisch opgeslagen om {{ savedAt }}.</p>
      <p v-if="error" class="error">Autosave fout: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, onMounted, watch } from 'vue'
import { useAdminStore } from '../../stores/admin'
import ImageUpload from '../../components/admin/ImageUpload.vue'
import { useAutosave } from '../../composables/autosave'

const admin = useAdminStore()
const busy = ref(null)
const expanded = ref(new Set())
const dragId = ref(null)
const dragOverId = ref(null)
const isEditing = ref(false)

const sortedBlocks = computed(() => [...admin.blocks].sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0)))
const { savingKey, savedAt, error, queue, flush } = useAutosave((block) => admin.updateBlock(block))

const typeOptions = [
  { value: 'text', label: 'Tekst' },
  { value: 'feature', label: 'Feature (gecentreerd)' },
  { value: 'image-text', label: 'Afbeelding + tekst' },
  { value: 'cta', label: 'Call-to-action' },
  { value: 'benefits', label: 'Voordelen (icoon-kaarten)' },
  { value: 'process', label: 'Werkwijze (genummerde stappen)' },
  { value: 'projects', label: 'Projecten (portfolio kaarten)' },
  { value: 'stats', label: 'Statistieken (cijfers)' },
  { value: 'logos', label: 'Logo wall' },
  { value: 'faq', label: 'FAQ (uitklap)' },
  { value: 'quote', label: 'Quote / getuigenis' },
  { value: 'packages', label: 'Pakketten (uit /admin/packages)' },
  { value: 'offerte', label: 'Offerte configurator' },
]

const TYPE_LABELS = Object.fromEntries(typeOptions.map((t) => [t.value, t.label]))
const WIDTH_LABELS = { full: 'Volledig', twoThird: '2/3', half: '1/2', third: '1/3' }

onMounted(() => admin.load())

// Normalize items on block load to ensure structure (e.g. tagsString helper for projects)
watch(() => admin.blocks, (blocks) => {
  for (const b of blocks) {
    if (!Array.isArray(b.items)) b.items = []
    if (b.type === 'projects') {
      for (const item of b.items) {
        if (item.tagsString === undefined) {
          item.tagsString = Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
        }
      }
    }
  }
}, { immediate: true, deep: true })

function typeLabel(t) { return TYPE_LABELS[t] || t }
function widthLabel(w) { return WIDTH_LABELS[w] || w }

function isExpanded(id) { return expanded.value.has(id) }
function toggleExpand(id) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
}

function usesHeader(type) {
  return ['text', 'feature', 'cta', 'benefits', 'process', 'projects', 'stats', 'logos', 'faq', 'image-text', 'packages', 'offerte', 'quote'].includes(type)
}
function usesBody(type) { return ['text', 'feature', 'cta', 'image-text', 'quote', 'offerte'].includes(type) }
function usesImage(type) { return ['image-text', 'feature'].includes(type) }
function usesCta(type) { return ['text', 'feature', 'cta', 'image-text', 'projects'].includes(type) }
function usesItems(type) { return ['benefits', 'process', 'projects', 'stats', 'logos', 'faq'].includes(type) }

function variantOptions(type) {
  if (type === 'image-text') {
    return [
      { value: 'image-left', label: 'Afbeelding links' },
      { value: 'image-right', label: 'Afbeelding rechts' },
    ]
  }
  return [
    { value: 'default', label: 'Standaard' },
    { value: 'highlight', label: 'Uitgelicht' },
    { value: 'quiet', label: 'Rustig' },
  ]
}

function itemsLabel(type) {
  return {
    benefits: 'Voordelen',
    process: 'Stappen',
    projects: 'Projecten',
    stats: 'Statistieken',
    logos: 'Logos',
    faq: 'Vragen',
  }[type] || 'Items'
}
function itemsSingularLabel(type) {
  return {
    benefits: 'Voordeel',
    process: 'Stap',
    projects: 'Project',
    stats: 'Statistiek',
    logos: 'Logo',
    faq: 'Vraag',
  }[type] || 'Item'
}

function emptyItem(type) {
  switch (type) {
    case 'benefits': return { iconKey: 'fast', title: '', text: '' }
    case 'process': return { iconKey: 'chat', title: '', text: '' }
    case 'projects': return { variant: 'chat', title: '', text: '', tags: [], tagsString: '' }
    case 'stats': return { value: '', label: '', text: '' }
    case 'logos': return { imageUrl: '', label: '', url: '' }
    case 'faq': return { question: '', answer: '' }
    default: return {}
  }
}

function defaultsForType(type) {
  const t = type
  const base = {
    type: t, title: '', subtitle: '', body: '',
    ctaLabel: '', ctaUrl: '',
    width: 'full', variant: t === 'image-text' ? 'image-left' : 'default',
    enabled: true, items: [],
  }
  if (t === 'benefits') base.items = [emptyItem('benefits')]
  if (t === 'process') base.items = [emptyItem('process')]
  if (t === 'projects') base.items = [emptyItem('projects')]
  if (t === 'stats') base.items = [emptyItem('stats')]
  if (t === 'logos') base.items = [emptyItem('logos')]
  if (t === 'faq') base.items = [emptyItem('faq')]
  return base
}

async function add() {
  const next = defaultsForType('text')
  next.title = 'Nieuw blok'
  next.sortOrder = admin.blocks.length
    ? Math.max(...admin.blocks.map((b) => Number(b.sortOrder || 0))) + 10
    : 10
  const created = await admin.createBlock(next)
  expanded.value.add(created.id)
}

function onTypeChange(b) {
  if (usesItems(b.type) && (!b.items || !b.items.length)) {
    b.items = [emptyItem(b.type)]
  }
  if (b.type === 'image-text' && !['image-left', 'image-right'].includes(b.variant)) {
    b.variant = 'image-left'
  } else if (b.type !== 'image-text' && ['image-left', 'image-right'].includes(b.variant)) {
    b.variant = 'default'
  }
  queueSave(b)
}

function addItem(b) {
  if (!Array.isArray(b.items)) b.items = []
  b.items.push(emptyItem(b.type))
  queueSave(b)
}
function removeItem(b, idx) {
  b.items.splice(idx, 1)
  queueSave(b)
}

function onProjectTagsInput(b, item) {
  item.tags = String(item.tagsString || '').split(',').map((s) => s.trim()).filter(Boolean)
  queueSave(b)
}

function cleanForSave(b) {
  const copy = JSON.parse(JSON.stringify(b))
  if (Array.isArray(copy.items) && copy.type === 'projects') {
    for (const it of copy.items) delete it.tagsString
  }
  return copy
}

function queueSave(block) { nextTick(() => queue(block.id, cleanForSave(block))) }
async function save(b) { busy.value = b.id; try { await flush(b.id, cleanForSave(b)) } finally { busy.value = null } }
async function remove(id) { if (confirm('Blok verwijderen?')) await admin.deleteBlock(id) }

// Drag & drop reordering
function onDragStart(b, e) {
  if (isEditing.value) { e.preventDefault(); return }
  dragId.value = b.id
  e.dataTransfer.effectAllowed = 'move'
  try { e.dataTransfer.setData('text/plain', String(b.id)) } catch {}
}
function onDragOver(b) {
  if (!dragId.value || dragId.value === b.id) return
  dragOverId.value = b.id
}
function onDragLeave(b) {
  if (dragOverId.value === b.id) dragOverId.value = null
}
async function onDrop(b) {
  if (!dragId.value || dragId.value === b.id) return
  const list = sortedBlocks.value.slice()
  const fromIdx = list.findIndex((x) => x.id === dragId.value)
  const toIdx = list.findIndex((x) => x.id === b.id)
  if (fromIdx === -1 || toIdx === -1) return
  const [moved] = list.splice(fromIdx, 1)
  list.splice(toIdx, 0, moved)
  // Renumber sortOrder by 10s
  for (let i = 0; i < list.length; i++) {
    list[i].sortOrder = (i + 1) * 10
  }
  // Persist updated sortOrders
  for (const item of list) {
    queue(item.id, cleanForSave(item))
  }
  dragId.value = null
  dragOverId.value = null
}
function onDragEnd() { dragId.value = null; dragOverId.value = null }
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; gap: 20px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.list { display: flex; flex-direction: column; gap: 12px; }
.empty { padding: 28px; text-align: center; }
.status-row { margin-top: 8px; }
.mt { margin-top: 14px; }

.block-card {
  padding: 0;
  overflow: hidden;
  transition: border-color 0.15s ease, transform 0.15s ease, opacity 0.15s ease;
}
.block-card.dragging { opacity: 0.5; }
.block-card.drag-over { border-color: var(--accent); transform: translateY(-2px); }

.block-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 14px;
  align-items: center;
  padding: 14px 18px;
}
.drag-handle {
  cursor: grab;
  color: var(--muted);
  font-weight: bold;
  letter-spacing: -2px;
  user-select: none;
  padding: 4px 6px;
}
.drag-handle:active { cursor: grabbing; }
.head-info {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-wrap: wrap;
}
.type-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.hidden-pill {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--surface-2);
  color: var(--muted);
  font-size: 0.72rem;
}
.block-title { font-size: 0.95rem; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.head-meta { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
.icon-btn {
  width: 32px; height: 32px;
  display: grid; place-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  cursor: pointer;
}
.icon-btn svg { width: 18px; height: 18px; transition: transform 0.2s ease; }
.icon-btn svg.rotated { transform: rotate(180deg); }
.icon-btn:hover { border-color: var(--accent-2); color: var(--accent-2); }

.block-body { padding: 0 18px 18px; border-top: 1px solid var(--border); padding-top: 18px; }

.actions { display: flex; gap: 10px; align-items: center; margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); flex-wrap: wrap; }
.check label { display: flex; align-items: center; gap: 8px; padding-top: 28px; cursor: pointer; }
.danger { color: var(--danger); border-color: var(--danger-border); }
.danger:hover { background: var(--danger-bg); }
.error { color: var(--danger); }

.info-note {
  margin-top: 16px;
  padding: 10px 14px;
  border: 1px solid var(--info-border);
  border-radius: 8px;
  background: var(--info-bg);
  color: var(--accent-2);
  font-size: 0.88rem;
}
.info-note a { color: var(--accent-2); border-bottom: 1px solid currentColor; }

.items-section {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px dashed var(--border);
}
.items-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.items-head h3 { margin: 0; font-size: 1rem; }
.btn-sm { min-height: 36px; padding: 6px 14px; font-size: 0.85rem; }
.items-list { display: flex; flex-direction: column; gap: 10px; }
.item-row {
  display: grid;
  gap: 8px;
  align-items: center;
  padding: 10px;
  background: color-mix(in srgb, var(--surface) 60%, transparent);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.item-num {
  width: 26px; height: 26px;
  display: grid; place-items: center;
  border-radius: 999px;
  background: var(--accent-dim);
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 700;
  flex-shrink: 0;
}
.item-icon { max-width: 200px; }
.item-del {
  width: 36px;
  padding: 6px 0;
  font-size: 1.1rem;
  line-height: 1;
}

/* Per-type item layouts */
.item-benefits, .item-process { grid-template-columns: 26px 200px minmax(0, 1fr) minmax(0, 1.4fr) auto; }
.item-projects { grid-template-columns: 26px 160px minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr) auto; }
.item-stats { grid-template-columns: 26px 130px 180px minmax(0, 1fr) auto; }
.item-logos { grid-template-columns: 26px 200px minmax(0, 1fr) minmax(0, 1fr) auto; }
.item-faq { grid-template-columns: 26px 1fr auto; gap: 10px; }
.item-faq .faq-q { grid-column: 2; }
.item-faq .faq-a { grid-column: 2 / -2; }
.item-faq .item-del { grid-column: -2; align-self: start; }

.logo-upload :deep(.dropzone) { padding: 12px; font-size: 0.78rem; }
.logo-upload :deep(.preview img) { height: 60px; }

@media (max-width: 1100px) {
  .item-benefits, .item-process, .item-projects, .item-stats, .item-logos {
    grid-template-columns: 26px 1fr auto;
    gap: 8px;
  }
  .item-row > .input, .item-row > .select, .item-row > .item-icon, .item-row > .logo-upload, .item-row > .textarea {
    grid-column: 2;
  }
  .item-row > .item-del { grid-column: -2; align-self: start; }
}

@media (max-width: 760px) {
  .block-head { grid-template-columns: auto 1fr auto; gap: 8px; padding: 12px; }
  .head-meta { flex-direction: column-reverse; align-items: flex-end; gap: 6px; }
}
</style>
