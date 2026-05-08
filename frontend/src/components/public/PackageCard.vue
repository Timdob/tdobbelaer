<template>
  <article class="pkg" :class="{ highlighted: pkg.highlighted }">
    <div v-if="pkg.highlighted" class="badge badge-popular">Meest gekozen</div>
    <h3 class="name">{{ pkg.name }}</h3>
    <p class="desc">{{ pkg.description }}</p>

    <div class="price">
      <span class="amount">€{{ formatPrice(pkg.price) }}</span>
      <span class="period">{{ pkg.period }}</span>
    </div>

    <ul class="features">
      <li v-for="(f, i) in features" :key="i">{{ f }}</li>
    </ul>

    <router-link :to="quoteUrl" class="btn" :class="pkg.highlighted ? 'btn-primary' : 'btn-ghost'">
      {{ pkg.ctaLabel || 'Gratis offerte aanvragen' }}
    </router-link>
  </article>
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({ pkg: { type: Object, required: true } })

const features = computed(() =>
  (props.pkg.features || '').split('\n').map((s) => s.trim()).filter(Boolean),
)
const quoteUrl = computed(() => ({
  path: '/offerte',
  query: { pakket: props.pkg.name, id: props.pkg.id },
}))

function formatPrice(p) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(p)
}
</script>

<style scoped>
.pkg {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 28px;
  display: flex;
  flex-direction: column;
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.pkg:hover {
  transform: translateY(-3px);
  border-color: var(--accent-dim);
  box-shadow: var(--shadow);
}
.pkg.highlighted {
  border-color: var(--accent);
  box-shadow: var(--glow), var(--shadow);
}
.pkg.highlighted::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  padding: 1px;
  background: linear-gradient(135deg, var(--accent), var(--accent-2));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
          mask-composite: exclude;
  pointer-events: none;
}
.badge { align-self: flex-start; margin-bottom: 14px; }
.name { margin-bottom: 8px; }
.desc { color: var(--muted); font-size: 0.95rem; min-height: 70px; }
.price {
  display: flex; align-items: baseline; gap: 8px; margin: 12px 0 18px;
  padding-bottom: 18px; border-bottom: 1px solid var(--border);
}
.amount { font-size: 2rem; font-weight: 800; color: var(--text); }
.period { color: var(--muted); font-size: 0.9rem; }
.features {
  list-style: none; padding: 0; margin: 0 0 24px;
  display: flex; flex-direction: column; gap: 10px; flex: 1;
}
.features li { color: var(--muted); font-size: 0.93rem; }
.features li::before { content: "✓"; color: var(--accent-2); font-weight: 900; margin-right: 8px; }
.btn { width: 100%; }
</style>
