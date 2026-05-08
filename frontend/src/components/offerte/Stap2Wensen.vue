<template>
  <div class="stap2">
    <header class="stap-head">
      <span class="eyebrow">{{ step.eyebrow }}</span>
      <h2>{{ step.title }}</h2>
      <p class="lead">{{ step.lead }}</p>
    </header>

    <div class="layout">
      <div class="wensen-grid">
        <button
          v-for="w in offerte.wishes"
          :key="w.id"
          type="button"
          class="wens-card"
          :class="{ active: offerte.wensen.includes(w.id) }"
          @click="offerte.toggleWens(w.id)"
        >
          <span class="icon">{{ w.icon }}</span>
          <span class="label">{{ w.label }}</span>
          <span class="check" aria-hidden="true">{{ offerte.wensen.includes(w.id) ? 'OK' : '' }}</span>
        </button>
      </div>

      <PrijsIndicator />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOfferteStore } from '../../stores/offerte'
import PrijsIndicator from './PrijsIndicator.vue'

const offerte = useOfferteStore()
const step = computed(() => offerte.quoteConfig.steps[1])
</script>

<style scoped>
.stap-head { margin-bottom: 28px; max-width: 680px; }
.stap-head h2 { margin-top: 12px; }
.layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: start; }
.wensen-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.wens-card {
  position: relative; display: flex; align-items: center; gap: 14px; padding: 18px 22px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--text); font-family: var(--font); text-align: left; cursor: pointer;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.wens-card:hover { transform: translateY(-2px); border-color: var(--accent-dim); }
.wens-card.active { border-color: var(--accent); background: linear-gradient(135deg, var(--accent-dim), transparent); box-shadow: var(--glow); }
.icon {
  min-width: 46px; padding: 5px 8px; border-radius: 999px; background: var(--surface-2);
  color: var(--accent-2); text-align: center; font-size: 0.68rem; font-weight: 800;
}
.label { font-weight: 600; font-size: 0.95rem; flex: 1; }
.check {
  display: grid; place-items: center; width: 28px; height: 24px; border-radius: 999px;
  border: 1px solid var(--border-2); color: transparent; font-weight: 800; font-size: 0.7rem;
}
.wens-card.active .check { background: var(--accent); border-color: var(--accent); color: var(--text-inverse); }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .wensen-grid { grid-template-columns: 1fr; }
}
</style>
