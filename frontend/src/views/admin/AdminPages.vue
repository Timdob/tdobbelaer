<template>
  <div class="pages-admin">
    <header class="head">
      <div>
        <span class="eyebrow">CMS</span>
        <h1>Pagina's</h1>
        <p class="muted">Beheer pagina-inhoud, secties, SEO en media. Het hoofdmenu heeft een eigen adminpagina.</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost" @click="reload">Verversen</button>
        <button class="btn btn-primary" @click="add">Nieuwe pagina</button>
      </div>
    </header>

    <div class="workspace">
      <aside class="page-list">
        <div class="list-head">
          <strong>Pagina's</strong>
          <span>{{ sortedPages.length }} totaal</span>
        </div>

        <button
          v-for="page in sortedPages"
          :key="page.id"
          class="page-item"
          :class="{ active: selected?.id === page.id }"
          type="button"
          @click="select(page)"
        >
          <span class="status-dot" :class="{ published: page.published }"></span>
          <div>
            <strong>{{ page.title || 'Naamloos' }}</strong>
            <small>{{ page.published ? 'Live' : 'Concept' }} · {{ page.showInNav ? 'In menu' : 'Niet in menu' }} · /{{ page.slug }}</small>
          </div>
        </button>

        <p v-if="!sortedPages.length" class="muted small empty-list">Nog geen pagina's.</p>
      </aside>

      <section class="editor-shell">
        <div class="tabs" role="tablist" aria-label="Pagina editor">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <section v-if="activeTab === 'media'" class="panel">
          <div class="panel-title">
            <div>
              <h2>Media</h2>
              <p class="muted small">Klik op een afbeelding om de URL te kopieren. Uploaden kan in de content- en sectie-editor.</p>
            </div>
            <button class="btn btn-ghost" @click="admin.loadMedia">Verversen</button>
          </div>

          <div v-if="admin.media.length" class="media-grid">
            <button v-for="asset in admin.media" :key="asset.id" class="media-item" type="button" @click="copyMedia(asset.url)">
              <img :src="asset.url" :alt="asset.filename" />
              <span>{{ asset.filename }}</span>
            </button>
          </div>
          <p v-else class="muted">Nog geen media gevonden.</p>
        </section>

        <div v-else-if="!selected" class="empty-state">
          <h2>Selecteer een pagina</h2>
          <p class="muted">Kies links een pagina of maak een nieuwe pagina aan.</p>
        </div>

        <template v-else>
          <div class="editor-top">
            <div>
              <span class="eyebrow">{{ selected.published ? 'Live pagina' : 'Concept' }}</span>
              <h2>{{ selected.title || 'Nieuwe pagina' }}</h2>
              <p class="muted">/{{ safeSlug }}</p>
            </div>
            <div class="publish-controls">
              <label class="toggle">
                <input type="checkbox" v-model="selected.published" @change="queueSelected" />
                <span></span>
                Gepubliceerd
              </label>
            </div>
          </div>

          <div class="editor-grid">
            <main>
              <section v-if="activeTab === 'content'" class="panel">
                <div class="panel-title">
                  <div>
                    <h2>Pagina inhoud</h2>
                    <p class="muted small">Gebruik dit voor titel, URL, intro en vrije tekst. Secties staan in de volgende tab.</p>
                  </div>
                  <span>{{ saveStatus }}</span>
                </div>

                <div class="grid grid-2">
                  <div>
                    <label class="label">Titel</label>
                    <input v-model="selected.title" class="input title-input" @input="queueSelected" />
                  </div>
                  <div>
                    <label class="label">URL slug</label>
                    <input v-model="selected.slug" class="input" @input="normalizeSlugInput" />
                  </div>
                </div>

                <label class="label mt">Intro / korte omschrijving</label>
                <textarea v-model="selected.excerpt" class="textarea" rows="3" maxlength="180" @input="queueSelected"></textarea>
                <div class="char-row">{{ selected.excerpt?.length || 0 }}/180 tekens</div>

                <label class="label mt">Vrije tekst</label>
                <RichTextEditor v-model="selected.body" @update:modelValue="queueSelected" />
                <p class="muted small help">Als je secties gebruikt, worden die op de website boven deze vrije tekst geplaatst.</p>
              </section>

              <section v-if="activeTab === 'sections'" class="panel">
                <div class="panel-title">
                  <div>
                    <h2>Secties</h2>
                    <p class="muted small">Bouw deze pagina op met duidelijke blokken. De volgorde hieronder is ook de volgorde op de website.</p>
                  </div>
                  <div class="button-row">
                    <button class="btn btn-ghost" @click="addSection('text')">Tekst</button>
                    <button class="btn btn-ghost" @click="addSection('imageText')">Beeld + tekst</button>
                    <button class="btn btn-ghost" @click="addSection('cards')">Kaarten</button>
                    <button class="btn btn-primary" @click="addSection('cta')">CTA</button>
                  </div>
                </div>

                <div v-if="!selected.sections.length" class="empty-builder">
                  <h3>Nog geen secties</h3>
                  <p class="muted">Klik bovenaan op een sectietype om te starten.</p>
                </div>

                <article v-for="(section, index) in selected.sections" :key="section.id" class="section-card">
                  <div class="section-head">
                    <div>
                      <span class="eyebrow">Sectie {{ index + 1 }} · {{ sectionTypeLabel(section.type) }}</span>
                      <input v-model="section.title" class="input section-title-input" placeholder="Sectie titel" @input="queueSelected" />
                    </div>
                    <div class="row-actions">
                      <button class="btn btn-ghost" @click="moveSection(index, -1)" :disabled="index === 0">Omhoog</button>
                      <button class="btn btn-ghost" @click="moveSection(index, 1)" :disabled="index === selected.sections.length - 1">Omlaag</button>
                      <button class="btn btn-ghost danger" @click="removeSection(index)">Verwijder</button>
                    </div>
                  </div>

                  <div class="grid grid-2">
                    <div>
                      <label class="label">Kleine titel bovenaan</label>
                      <input v-model="section.kicker" class="input" placeholder="Bijv. Werkwijze" @input="queueSelected" />
                    </div>
                    <div>
                      <label class="label">Sectietype</label>
                      <select v-model="section.type" class="input" @change="normalizeSection(section); queueSelected()">
                        <option value="text">Tekst</option>
                        <option value="imageText">Beeld + tekst</option>
                        <option value="cards">Kaarten</option>
                        <option value="cta">Call to action</option>
                      </select>
                    </div>
                  </div>

                  <template v-if="section.type === 'text' || section.type === 'imageText'">
                    <label class="label mt">Tekst</label>
                    <RichTextEditor v-model="section.body" @update:modelValue="queueSelected" />
                  </template>

                  <template v-if="section.type === 'imageText'">
                    <label class="label mt">Afbeelding</label>
                    <ImageUpload v-model="section.imageUrl" @update:modelValue="queueSelected" />
                  </template>

                  <template v-if="section.type === 'cards'">
                    <label class="label mt">Intro tekst</label>
                    <textarea v-model="section.body" class="textarea" rows="2" @input="queueSelected"></textarea>
                    <div class="cards-editor">
                      <div v-for="(item, itemIndex) in section.items" :key="item.id" class="card-edit">
                        <input v-model="item.title" class="input" placeholder="Kaart titel" @input="queueSelected" />
                        <textarea v-model="item.text" class="textarea" rows="2" placeholder="Korte tekst" @input="queueSelected"></textarea>
                        <button class="btn btn-ghost danger" @click="removeCard(section, itemIndex)">Kaart verwijderen</button>
                      </div>
                      <button class="btn btn-ghost" @click="addCard(section)">Kaart toevoegen</button>
                    </div>
                  </template>

                  <template v-if="section.type === 'cta'">
                    <label class="label mt">CTA tekst</label>
                    <RichTextEditor v-model="section.body" @update:modelValue="queueSelected" />
                  </template>

                  <div class="grid grid-2 mt">
                    <div>
                      <label class="label">Knop tekst</label>
                      <input v-model="section.ctaLabel" class="input" placeholder="Plan een gesprek" @input="queueSelected" />
                    </div>
                    <div>
                      <label class="label">Knop URL</label>
                      <input v-model="section.ctaUrl" class="input" placeholder="/contact" @input="queueSelected" />
                    </div>
                  </div>
                </article>
              </section>

              <section v-if="activeTab === 'seo'" class="panel">
                <div class="panel-title">
                  <div>
                    <h2>SEO</h2>
                    <p class="muted small">Stel in hoe deze pagina in Google en social previews verschijnt.</p>
                  </div>
                  <span>{{ seoScore.label }}</span>
                </div>

                <label class="label">Meta title</label>
                <input v-model="selected.seoTitle" class="input" maxlength="70" @input="queueSelected" />
                <div class="char-row">{{ selected.seoTitle?.length || 0 }}/70 tekens</div>

                <label class="label mt">Meta description</label>
                <textarea v-model="selected.seoDescription" class="textarea" rows="3" maxlength="160" @input="queueSelected"></textarea>
                <div class="char-row">{{ selected.seoDescription?.length || 0 }}/160 tekens</div>

                <label class="label mt">Social afbeelding</label>
                <ImageUpload v-model="selected.ogImage" @update:modelValue="queueSelected" />

                <label class="toggle mt">
                  <input type="checkbox" v-model="selected.noIndex" @change="queueSelected" />
                  <span></span>
                  Niet indexeren door zoekmachines
                </label>

                <div class="serp mt">
                  <strong>{{ selected.seoTitle || selected.title || 'Pagina titel' }}</strong>
                  <span>{{ origin }}/{{ safeSlug }}</span>
                  <p>{{ selected.seoDescription || selected.excerpt || 'Korte beschrijving van deze pagina.' }}</p>
                </div>
              </section>
            </main>

            <aside class="side-editor">
              <section class="panel">
                <h3>Publicatie</h3>
                <div class="field-row">
                  <span>Status</span>
                  <strong :class="selected.published ? 'live' : 'draft'">{{ selected.published ? 'Live' : 'Concept' }}</strong>
                </div>
                <p class="muted small help">Menu zichtbaarheid beheer je via Admin > Menu.</p>
              </section>

              <section class="panel">
                <h3>Hero afbeelding</h3>
                <ImageUpload v-model="selected.heroImage" @update:modelValue="queueSelected" />
              </section>

              <section class="panel actions-panel">
                <router-link class="btn btn-ghost" :to="`/preview/${selected.id}`" target="_blank">Preview concept</router-link>
                <a v-if="selected.published" class="btn btn-ghost" :href="safeSlug === 'home' ? '/' : `/${safeSlug}`" target="_blank">Bekijk live</a>
                <button class="btn btn-ghost danger" @click="remove">Verwijderen</button>
                <p v-if="error" class="error">Autosave fout: {{ error }}</p>
              </section>
            </aside>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdminStore } from '../../stores/admin'
import ImageUpload from '../../components/admin/ImageUpload.vue'
import RichTextEditor from '../../components/admin/RichTextEditor.vue'
import { useAutosave } from '../../composables/autosave'

const admin = useAdminStore()
const route = useRoute()
const router = useRouter()
const selected = ref(null)
const origin = window.location.origin
const tabs = [
  { id: 'content', label: 'Inhoud' },
  { id: 'sections', label: 'Secties' },
  { id: 'seo', label: 'SEO' },
  { id: 'media', label: 'Media' },
]
const activeTab = ref(tabs.some((tab) => tab.id === route.query.tab) ? route.query.tab : 'content')
const { savingKey, savedAt, error, queue } = useAutosave((page) => admin.updatePage(page))

const sortedPages = computed(() => [...admin.pages].sort((a, b) =>
  (Number(a.sortOrder || 0) - Number(b.sortOrder || 0)) || String(a.title || '').localeCompare(String(b.title || '')),
))
const safeSlug = computed(() => normalizeSlug(selected.value?.slug || 'pagina'))
const saveStatus = computed(() => {
  if (savingKey.value === selected.value?.id) return 'Autosave...'
  if (savedAt.value) return `Opgeslagen om ${savedAt.value}`
  return 'Autosave actief'
})
const seoScore = computed(() => {
  const title = selected.value?.seoTitle || selected.value?.title || ''
  const description = selected.value?.seoDescription || selected.value?.excerpt || ''
  return title.length >= 30 && title.length <= 70 && description.length >= 80 && description.length <= 160
    ? { label: 'SEO compleet' }
    : { label: 'SEO kan beter' }
})

watch(activeTab, (tab) => {
  router.replace({ path: '/admin/pages', query: tab === 'content' ? {} : { tab } })
})

onMounted(async () => {
  await admin.loadAll()
  await admin.loadMedia()
  const requested = route.query.id ? admin.pages.find((page) => String(page.id) === String(route.query.id)) : null
  if (requested) select(requested)
  else if (sortedPages.value.length) select(sortedPages.value[0])
})

function select(page) {
  selected.value = normalizeSelected(page)
}

function normalizeSelected(page) {
  return {
    ...page,
    slug: normalizeSlug(page.slug),
    title: page.title || '',
    excerpt: page.excerpt || '',
    body: page.body || '',
    heroImage: page.heroImage || '',
    seoTitle: page.seoTitle || '',
    seoDescription: page.seoDescription || '',
    ogImage: page.ogImage || '',
    noIndex: Boolean(page.noIndex),
    published: Boolean(page.published),
    showInNav: page.showInNav !== false,
    sortOrder: Number(page.sortOrder || 0),
    sections: Array.isArray(page.sections) ? JSON.parse(JSON.stringify(page.sections)).map(normalizeSection) : [],
  }
}

function normalizeSection(section) {
  section.id = section.id || `section-${Date.now()}-${Math.random().toString(16).slice(2)}`
  section.type = section.type || 'text'
  section.kicker = section.kicker || ''
  section.title = section.title || ''
  section.body = section.body || ''
  section.imageUrl = section.imageUrl || ''
  section.ctaLabel = section.ctaLabel || ''
  section.ctaUrl = section.ctaUrl || ''
  section.items = Array.isArray(section.items) ? section.items.map((item) => ({
    id: item.id || `card-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: item.title || '',
    text: item.text || '',
  })) : []
  if (section.type === 'cards' && !section.items.length) addDefaultCards(section)
  return section
}

function cleanPage(page) {
  return {
    ...page,
    slug: normalizeSlug(page.slug),
    sections: Array.isArray(page.sections) ? page.sections.map((section) => normalizeSection({ ...section })) : [],
  }
}

function queueSelected() {
  if (!selected.value) return
  nextTick(() => queue(selected.value.id, cleanPage(selected.value)))
}

function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'pagina'
}

function normalizeSlugInput() {
  if (!selected.value) return
  selected.value.slug = normalizeSlug(selected.value.slug)
  queueSelected()
}

async function reload() {
  await admin.loadAll(true)
  await admin.loadMedia()
  if (!selected.value && sortedPages.value.length) select(sortedPages.value[0])
  if (selected.value) {
    const fresh = admin.pages.find((page) => page.id === selected.value.id)
    selected.value = fresh ? normalizeSelected(fresh) : (sortedPages.value[0] ? normalizeSelected(sortedPages.value[0]) : null)
  }
}

async function add() {
  const page = await admin.createPage({
    title: 'Nieuwe pagina',
    slug: `pagina-${Date.now()}`,
    excerpt: '',
    body: '',
    heroImage: '',
    published: false,
    showInNav: true,
    sortOrder: admin.pages.length + 1,
    seoTitle: '',
    seoDescription: '',
    ogImage: '',
    noIndex: false,
    sections: [],
  })
  select(page)
  activeTab.value = 'content'
}

async function remove() {
  if (!selected.value || !confirm('Pagina verwijderen?')) return
  await admin.deletePage(selected.value.id)
  selected.value = sortedPages.value[0] ? normalizeSelected(sortedPages.value[0]) : null
}

function addSection(type) {
  if (!selected.value) return
  const section = normalizeSection({
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    type,
    kicker: '',
    title: sectionTypeLabel(type),
    body: type === 'cards' ? 'Korte intro voor deze kaarten.' : '<p>Schrijf hier je tekst.</p>',
    imageUrl: '',
    ctaLabel: type === 'cta' ? 'Plan een gesprek' : '',
    ctaUrl: type === 'cta' ? '/contact' : '',
    items: [],
  })
  selected.value.sections.push(section)
  queueSelected()
}

function addDefaultCards(section) {
  section.items = [
    { id: `card-${Date.now()}-1`, title: 'Kaart titel', text: 'Korte uitleg.' },
    { id: `card-${Date.now()}-2`, title: 'Kaart titel', text: 'Korte uitleg.' },
    { id: `card-${Date.now()}-3`, title: 'Kaart titel', text: 'Korte uitleg.' },
  ]
}

function moveSection(index, direction) {
  const next = index + direction
  if (!selected.value || next < 0 || next >= selected.value.sections.length) return
  const sections = selected.value.sections
  ;[sections[index], sections[next]] = [sections[next], sections[index]]
  queueSelected()
}

function removeSection(index) {
  if (!selected.value) return
  selected.value.sections.splice(index, 1)
  queueSelected()
}

function addCard(section) {
  section.items = section.items || []
  section.items.push({ id: `card-${Date.now()}`, title: 'Nieuwe kaart', text: 'Korte uitleg.' })
  queueSelected()
}

function removeCard(section, index) {
  section.items.splice(index, 1)
  queueSelected()
}

function sectionTypeLabel(type) {
  return {
    text: 'Tekst',
    imageText: 'Beeld + tekst',
    cards: 'Kaarten',
    cta: 'Call to action',
  }[type] || 'Sectie'
}

async function copyMedia(url) {
  await navigator.clipboard?.writeText(url)
  admin.toast('Media URL gekopieerd')
}
</script>

<style scoped>
.head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 24px;
}
.head h1 { margin: 6px 0 4px; font-size: 2.15rem; }
.head-actions,
.button-row,
.row-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.workspace {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 22px;
  align-items: start;
}
.page-list,
.editor-shell,
.panel {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  box-shadow: 0 14px 30px color-mix(in srgb, var(--text) 7%, transparent);
}
.page-list {
  position: sticky;
  top: 28px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
}
.list-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 8px 12px;
  border-bottom: 1px solid var(--border);
}
.list-head span,
.page-item small { color: var(--muted); font-size: 0.78rem; }
.page-item {
  display: grid;
  grid-template-columns: 10px 1fr;
  gap: 12px;
  align-items: center;
  width: 100%;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  text-align: left;
}
.page-item:hover { background: var(--surface-hover); }
.page-item.active {
  border-color: var(--border-strong);
  background: var(--accent-dim);
}
.page-item strong { display: block; font-size: 0.92rem; }
.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--warning);
}
.status-dot.published { background: var(--success); }
.editor-shell { padding: 18px; }
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}
.tabs button {
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--muted);
  font-weight: 750;
}
.tabs button.active {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--text-inverse);
}
.editor-top {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--border);
}
.editor-top h2 { margin: 8px 0 4px; font-size: 1.8rem; }
.publish-controls { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.editor-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 18px;
  align-items: start;
}
.panel { padding: 20px; }
.panel + .panel { margin-top: 16px; }
.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}
.panel-title h2,
.panel h3 { margin: 0 0 6px; font-size: 1.15rem; }
.panel-title span { color: var(--accent); font-weight: 750; font-size: 0.86rem; }
.title-input,
.section-title-input { font-weight: 800; font-size: 1.05rem; }
.mt { margin-top: 16px; }
.help { margin-top: 10px; }
.char-row {
  display: flex;
  justify-content: flex-end;
  color: var(--muted);
  font-size: 0.78rem;
  margin-top: 6px;
}
.toggle {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: var(--text);
  font-size: 0.88rem;
  cursor: pointer;
}
.toggle input { display: none; }
.toggle span {
  position: relative;
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: var(--field-bg);
  border: 1px solid var(--border);
}
.toggle span::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--muted);
  transition: transform 0.18s ease, background 0.18s ease;
}
.toggle input:checked + span {
  border-color: var(--accent);
  background: var(--accent-dim);
}
.toggle input:checked + span::after {
  transform: translateX(18px);
  background: var(--accent);
}
.empty-state,
.empty-builder {
  padding: 52px 20px;
  text-align: center;
  border: 1px dashed var(--border);
  border-radius: 8px;
}
.section-card {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg) 42%, transparent);
}
.section-card + .section-card { margin-top: 16px; }
.section-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}
.section-head > div:first-child { flex: 1; }
.section-title-input { margin-top: 8px; }
.cards-editor {
  display: grid;
  gap: 12px;
  margin-top: 10px;
}
.card-edit {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}
.menu-builder { display: grid; gap: 10px; }
.menu-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  gap: 12px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg) 42%, transparent);
}
.menu-row small { display: block; color: var(--muted); }
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 14px;
}
.media-item {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg) 42%, transparent);
  color: var(--text);
  text-align: left;
}
.media-item img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 8px;
}
.media-item span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--muted);
  font-size: 0.78rem;
}
.field-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
  color: var(--muted);
}
.field-row strong { color: var(--text); }
.field-row .live { color: var(--success); }
.field-row .draft { color: var(--warning); }
.actions-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.actions-panel .btn { width: 100%; }
.serp {
  padding: 15px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg) 42%, transparent);
}
.serp strong { display: block; color: var(--accent); font-size: 1rem; }
.serp span { display: block; color: var(--success); font-size: 0.82rem; margin: 4px 0 8px; }
.serp p { margin: 0; font-size: 0.86rem; line-height: 1.55; }
.danger { color: var(--danger); border-color: var(--danger-border); }
.danger:hover { background: var(--danger-bg); }
.error { color: var(--danger); font-size: 0.86rem; }
.empty-list { padding: 10px; }
@media (max-width: 1180px) {
  .workspace,
  .editor-grid { grid-template-columns: 1fr; }
  .page-list { position: relative; top: 0; }
  .menu-row { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .head,
  .editor-top,
  .section-head { flex-direction: column; align-items: flex-start; }
  .head-actions,
  .head-actions .btn,
  .row-actions,
  .row-actions .btn { width: 100%; }
}
</style>
