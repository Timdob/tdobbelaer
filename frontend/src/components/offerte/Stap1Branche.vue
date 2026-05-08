<template>
  <div class="stap1">
    <header class="stap-head">
      <span class="eyebrow">{{ step.eyebrow }}</span>
      <h2>{{ step.title }}</h2>
      <p class="lead">{{ step.lead }}</p>
    </header>

    <div class="branche-grid">
      <button
        v-for="b in offerte.branches"
        :key="b.id"
        type="button"
        class="branche-card"
        :class="{ active: offerte.branche === b.id }"
        @click="offerte.setBranche(b.id)"
      >
        <span class="icon">{{ b.icon }}</span>
        <span class="label">{{ b.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOfferteStore } from '../../stores/offerte'
const offerte = useOfferteStore()
const step = computed(() => offerte.quoteConfig.steps[0])
</script>

<style scoped>
.stap-head { margin-bottom: 28px; max-width: 680px; }
.stap-head h2 { margin-top: 12px; }
.branche-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.branche-card {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px;
  padding: 28px 18px; min-height: 150px; background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); color: var(--text); font-family: var(--font); text-align: center;
  cursor: pointer; transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.branche-card:hover { transform: translateY(-3px); border-color: var(--accent-dim); box-shadow: var(--shadow); }
.branche-card.active { border-color: var(--accent); background: linear-gradient(135deg, var(--accent-dim), transparent); box-shadow: var(--glow); }
.icon {
  display: grid; place-items: center; min-width: 42px; height: 34px; padding: 0 10px;
  border-radius: 999px; background: var(--accent-dim); color: var(--accent-2);
  font-weight: 800; font-size: 0.8rem;
}
.label { font-weight: 600; font-size: 0.95rem; }
@media (max-width: 720px) {
  .branche-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
