<template>
  <div class="menu-admin">
    <header class="head">
      <div>
        <span class="eyebrow">Navigatie</span>
        <h1>Menu</h1>
        <p class="muted">Bepaal welke pagina's in het hoofdmenu staan en in welke volgorde.</p>
      </div>
      <button class="btn btn-ghost" @click="reload">Verversen</button>
    </header>

    <section class="panel">
      <div class="panel-title">
        <div>
          <h2>Hoofdmenu</h2>
          <p class="muted small">Zet pagina's aan voor het menu. Alleen gepubliceerde pagina's zijn zichtbaar op de website.</p>
        </div>
        <span>{{ visibleMenuCount }} zichtbaar</span>
      </div>

      <div class="menu-list">
        <article v-for="(page, index) in sortedPages" :key="page.id" class="menu-row" :class="{ disabled: !page.showInNav }">
          <div class="page-info">
            <strong>{{ page.title || 'Naamloos' }}</strong>
            <small>/{{ page.slug }} · {{ page.published ? 'live' : 'concept' }}</small>
          </div>

          <label class="toggle">
            <input type="checkbox" :checked="page.showInNav" @change="toggleMenu(page)" />
            <span></span>
            Toon in menu
          </label>

          <div class="row-actions">
            <button class="btn btn-ghost" @click="movePage(page, -1)" :disabled="!page.showInNav || menuIndex(page) === 0">Omhoog</button>
            <button class="btn btn-ghost" @click="movePage(page, 1)" :disabled="!page.showInNav || menuIndex(page) === menuPages.length - 1">Omlaag</button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'

const admin = useAdminStore()

const sortedPages = computed(() => [...admin.pages].sort((a, b) =>
  Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || String(a.title || '').localeCompare(String(b.title || '')),
))
const menuPages = computed(() => sortedPages.value.filter((page) => page.showInNav))
const visibleMenuCount = computed(() => admin.pages.filter((page) => page.showInNav && page.published).length)

onMounted(() => admin.loadAll())

async function reload() {
  await admin.loadAll(true)
}

async function toggleMenu(page) {
  await admin.updatePage({ ...page, showInNav: !page.showInNav })
}

function menuIndex(page) {
  return menuPages.value.findIndex((item) => item.id === page.id)
}

async function movePage(page, direction) {
  const pages = menuPages.value
  const index = pages.findIndex((item) => item.id === page.id)
  const next = pages[index + direction]
  if (!next) return
  const currentOrder = Number(page.sortOrder || index + 1)
  const nextOrder = Number(next.sortOrder || index + direction + 1)
  await admin.updatePage({ ...page, sortOrder: nextOrder })
  await admin.updatePage({ ...next, sortOrder: currentOrder })
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
.panel {
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  box-shadow: 0 14px 30px color-mix(in srgb, var(--text) 7%, transparent);
}
.panel-title {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  margin-bottom: 18px;
}
.panel-title h2 { margin: 0 0 6px; font-size: 1.15rem; }
.panel-title span { color: var(--accent); font-weight: 750; font-size: 0.86rem; }
.menu-list { display: grid; gap: 10px; }
.menu-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 14px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--bg) 42%, transparent);
}
.menu-row.disabled {
  opacity: 0.68;
}
.page-info strong { display: block; }
.page-info small { display: block; color: var(--muted); }
.row-actions { display: flex; gap: 10px; }
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
@media (max-width: 900px) {
  .head,
  .panel-title { flex-direction: column; align-items: flex-start; }
  .menu-row { grid-template-columns: 1fr; }
  .row-actions,
  .row-actions .btn { width: 100%; }
}
</style>
