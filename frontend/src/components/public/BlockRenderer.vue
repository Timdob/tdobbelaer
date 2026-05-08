<template>
  <section class="block" :class="`type-${block.type}`">
    <div class="container">
      <template v-if="block.type === 'feature'">
        <header v-if="block.title || block.subtitle" class="feature-head">
          <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
          <h2 v-if="block.title">{{ block.title }}</h2>
        </header>
        <div class="features-grid">
          <div v-for="(item, i) in featureItems" :key="i" class="feature card">
            <div v-if="item.icon" class="feature-icon">{{ item.icon }}</div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.body }}</p>
          </div>
        </div>
      </template>

      <template v-else-if="block.type === 'cta'">
        <div class="cta-banner">
          <div>
            <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
            <h2 v-if="block.title">{{ block.title }}</h2>
            <div v-if="block.body" class="body" v-html="block.body"></div>
          </div>
          <a v-if="block.ctaLabel" :href="block.ctaUrl || '#'" class="btn btn-primary">
            {{ block.ctaLabel }}
          </a>
        </div>
      </template>

      <template v-else>
        <div class="text-block" :class="{ 'with-image': block.imageUrl }">
          <div class="text-content">
            <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
            <h2 v-if="block.title">{{ block.title }}</h2>
            <div v-if="block.body" class="body" v-html="block.body"></div>
            <a v-if="block.ctaLabel" :href="block.ctaUrl || '#'" class="btn btn-primary mt">
              {{ block.ctaLabel }}
            </a>
          </div>
          <div v-if="block.imageUrl" class="text-image">
            <img :src="block.imageUrl" :alt="block.title || ''" />
          </div>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ block: { type: Object, required: true } })

const featureItems = computed(() => {
  const raw = props.block.body || ''
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw
    .split(/\n\s*\n|\n(?=[^\s])/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split('\n').map((s) => s.trim()).filter(Boolean)
      const first = lines[0] || ''
      const iconMatch = first.match(/^(\p{Extended_Pictographic}|[\u{1F300}-\u{1FAFF}]|[☀-➿])\s*/u)
      const icon = iconMatch ? iconMatch[0].trim() : ''
      const title = icon ? first.slice(iconMatch[0].length).trim() : first
      const body = lines.slice(1).join(' ')
      return { icon, title, body }
    })
})
</script>

<style scoped>
.block { padding: 80px 0; }

.feature-head {
  text-align: center;
  max-width: 720px;
  margin: 0 auto 48px;
}
.feature-head h2 { margin-top: 12px; }

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}
.feature {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 28px;
}
.feature-icon {
  font-size: 1.8rem;
  margin-bottom: 8px;
}
.feature h3 { margin: 0; font-size: 1.05rem; }
.feature p { margin: 0; color: var(--muted); font-size: 0.92rem; line-height: 1.65; }

.cta-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
  padding: 48px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-strong);
  background:
    radial-gradient(circle at 0% 0%, var(--accent-dim), transparent 55%),
    radial-gradient(circle at 100% 100%, var(--accent-2-dim), transparent 55%),
    var(--surface);
  box-shadow: var(--shadow);
}
.cta-banner h2 { margin: 12px 0 0; max-width: 720px; }
.cta-banner .body :deep(p) { color: var(--muted); margin: 12px 0 0; max-width: 640px; }
.cta-banner .btn { flex-shrink: 0; }

.text-block.with-image {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}
.text-content { max-width: 720px; }
.text-content h2 { margin-top: 12px; }
.text-content .body :deep(p) { color: var(--muted); margin: 0 0 1em; line-height: 1.75; }
.text-content .body :deep(a) { color: var(--accent-2); }
.text-image img {
  width: 100%;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}
.mt { margin-top: 20px; }

@media (max-width: 900px) {
  .features-grid { grid-template-columns: 1fr; }
  .text-block.with-image { grid-template-columns: 1fr; }
  .cta-banner { flex-direction: column; align-items: flex-start; padding: 32px; }
}
</style>
