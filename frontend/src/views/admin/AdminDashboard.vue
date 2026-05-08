<template>
  <div>
    <header class="head">
      <h1>Dashboard</h1>
      <p class="muted">Overzicht van je site, klanten en berichten.</p>
    </header>

    <div class="stats">
      <div class="stat card"><span class="stat-num">{{ admin.pages.length }}</span><span class="muted small">Pagina's</span></div>
      <div class="stat card"><span class="stat-num">{{ admin.heroSlides.length }}</span><span class="muted small">Hero slides</span></div>
      <div class="stat card"><span class="stat-num">{{ admin.packages.length }}</span><span class="muted small">Pakketten</span></div>
      <div class="stat card"><span class="stat-num">{{ admin.blocks.length }}</span><span class="muted small">Homepage blokken</span></div>
      <div class="stat card"><span class="stat-num">{{ admin.customers.length }}</span><span class="muted small">Klanten</span></div>
      <div class="stat card"><span class="stat-num">{{ admin.messagesUnread }}</span><span class="muted small">Nieuwe berichten</span></div>
      <div class="stat card"><span class="stat-num">€{{ totalRevenue }}</span><span class="muted small">Recurring / maand</span></div>
    </div>

    <div class="dash-grid">
      <section class="panel">
        <div class="panel-head">
          <h2>Laatste berichten</h2>
          <router-link to="/admin/messages" class="small">Alles bekijken</router-link>
        </div>
        <div class="message-stack">
          <router-link
            v-for="message in latestMessages"
            :key="message.id"
            to="/admin/messages"
            class="message-row"
            :class="{ unread: message.status === 'nieuw' }"
          >
            <span>{{ message.subject }}</span>
            <small>{{ message.name }} · {{ formatDate(message.createdAt) }}</small>
          </router-link>
          <p v-if="!latestMessages.length" class="muted small">Nog geen berichten.</p>
        </div>
      </section>

      <section class="panel">
        <h2>Recente activiteit</h2>
        <div class="activity">
          <div v-for="item in activity" :key="item.label" class="activity-row">
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
          </div>
        </div>
      </section>

      <section class="quick panel">
        <h2>Snel naar</h2>
        <div class="quick-grid">
          <router-link to="/admin/settings" class="card link">Site instellingen</router-link>
          <router-link to="/admin/hero" class="card link">Hero slider beheren</router-link>
          <router-link to="/admin/packages" class="card link">Pakketten aanpassen</router-link>
          <router-link to="/admin/pages" class="card link">Pagina's beheren</router-link>
          <router-link to="/admin/customers" class="card link">Klanten</router-link>
          <router-link to="/admin/messages" class="card link">Berichten</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAdminStore } from '../../stores/admin'

const admin = useAdminStore()
onMounted(() => admin.loadAll())

const totalRevenue = computed(() =>
  new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })
    .format(admin.customers.reduce((sum, c) => sum + Number(c.monthlyTotal || 0), 0)),
)
const latestMessages = computed(() => admin.messages.slice(0, 10))
const activity = computed(() => [
  { label: 'Gepubliceerde pagina\'s', value: admin.pages.filter((p) => p.published).length },
  { label: 'Actieve klanten', value: admin.customers.filter((c) => c.status === 'Actief').length },
  { label: 'Uitgelichte pakketten', value: admin.packages.filter((p) => p.highlighted).length },
  { label: 'Nieuwe berichten', value: admin.messagesUnread },
])

function formatDate(value) {
  return new Date(value).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit' })
}
</script>

<style scoped>
.head { margin-bottom: 30px; }
.head h1 { font-size: 2rem; margin-bottom: 6px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 40px; }
.stat { padding: 22px; display: flex; flex-direction: column; gap: 4px; }
.stat-num {
  font-family: var(--font-display); font-size: 1.8rem; font-weight: 700;
  background: linear-gradient(135deg, var(--text), var(--accent-2));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.dash-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr); gap: 18px; }
.panel {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 22px;
}
.panel h2, .quick h2 { font-size: 1.2rem; margin-bottom: 16px; }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.panel-head a { color: var(--accent-2); }
.message-stack, .activity { display: flex; flex-direction: column; gap: 8px; }
.message-row {
  display: flex; flex-direction: column; gap: 4px; padding: 11px 12px;
  border: 1px solid var(--border); border-radius: var(--radius); color: var(--text);
}
.message-row:hover { border-color: var(--accent-2); }
.message-row.unread span { color: var(--accent-2); }
.message-row small { color: var(--muted); }
.activity-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 11px 0; border-bottom: 1px solid var(--border);
}
.activity-row:last-child { border-bottom: 0; }
.activity-row strong { color: var(--accent-2); }
.quick { grid-column: 1 / -1; }
.quick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
.link { padding: 18px 22px; transition: all 0.2s; }
.link:hover { transform: translateY(-2px); border-color: var(--border-strong); }
@media (max-width: 900px) {
  .dash-grid { grid-template-columns: 1fr; }
}
</style>
