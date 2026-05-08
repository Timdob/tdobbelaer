<template>
  <div class="stap-indicator">
    <button
      v-for="(label, i) in labels"
      :key="label"
      type="button"
      class="stap"
      :class="{ active: stap === i + 1, done: stap > i + 1, disabled: i + 1 > stap }"
      :disabled="i + 1 > stap"
      @click="$emit('select', i + 1)"
    >
      <span class="num">{{ stap > i + 1 ? 'OK' : i + 1 }}</span>
      <span class="label">{{ label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  stap: { type: Number, required: true },
  labels: { type: Array, default: () => ['Branche', 'Wensen', 'Gegevens'] },
})
defineEmits(['select'])
</script>

<style scoped>
.stap-indicator { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 36px; }
.stap {
  display: flex; align-items: center; gap: 12px; padding: 14px 18px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  color: var(--muted); font-family: var(--font); text-align: left; cursor: pointer;
  transition: border-color 0.2s, color 0.2s, background 0.2s;
}
.stap:disabled, .stap.disabled { cursor: not-allowed; opacity: 0.55; }
.stap.done { border-color: var(--accent-2); color: var(--accent-2); }
.stap.active { border-color: var(--accent); color: var(--text); background: linear-gradient(135deg, var(--accent-dim), transparent); box-shadow: var(--glow); }
.num {
  display: grid; place-items: center; width: 32px; height: 28px; border-radius: 999px;
  background: var(--surface-2); color: var(--muted); font-weight: 700; font-size: 0.78rem; flex-shrink: 0;
}
.stap.done .num { background: var(--accent-2); color: var(--bg); }
.stap.active .num { background: var(--accent); color: var(--text-inverse); box-shadow: var(--glow); }
.label { font-weight: 600; font-size: 0.92rem; }
@media (max-width: 720px) {
  .label { display: none; }
  .stap { justify-content: center; padding: 12px; }
}
</style>
