<template>
  <div class="home-blocks-flow">
    <div
      v-for="row in rows"
      :key="row.key"
      class="block-row"
      :class="{ 'block-row-grid': row.blocks.length > 1 }"
    >
      <article
        v-for="block in row.blocks"
        :key="block.id"
        class="home-block"
        :class="[
          `block-type-${block.type}`,
          `block-width-${block.width || 'full'}`,
          `block-variant-${block.variant || 'default'}`,
        ]"
      >
        <!-- BENEFITS -->
        <template v-if="block.type === 'benefits'">
          <div class="container">
            <header v-if="block.title || block.subtitle" class="section-title center">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2 v-if="block.title">{{ block.title }}</h2>
            </header>
            <div class="benefit-grid" :class="`cols-${benefitCols(block)}`">
              <article v-for="(item, i) in block.items" :key="i" class="benefit-card">
                <span class="benefit-icon" :class="iconClass(item.iconKey)" aria-hidden="true"><i></i></span>
                <div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.text }}</p>
                </div>
              </article>
            </div>
          </div>
        </template>

        <!-- PROCESS -->
        <template v-else-if="block.type === 'process'">
          <div class="container">
            <header v-if="block.title || block.subtitle" class="section-title center">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2 v-if="block.title">{{ block.title }}</h2>
            </header>
            <div class="steps" :class="`cols-${block.items?.length || 4}`">
              <article v-for="(item, i) in block.items" :key="i" class="step-card">
                <span class="step-number">{{ i + 1 }}</span>
                <span class="step-icon" v-html="processIcon(item.iconKey)" aria-hidden="true"></span>
                <h3>{{ item.title }}</h3>
                <p>{{ item.text }}</p>
              </article>
            </div>
          </div>
        </template>

        <!-- PROJECTS -->
        <template v-else-if="block.type === 'projects'">
          <div class="container">
            <div class="section-row">
              <div v-if="block.title || block.subtitle" class="section-title">
                <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
                <h2 v-if="block.title">{{ block.title }}</h2>
              </div>
              <router-link v-if="block.ctaLabel" :to="block.ctaUrl || '/contact'" class="btn btn-ghost">
                {{ block.ctaLabel }}
              </router-link>
            </div>
            <div class="project-grid" :class="`cols-${Math.min(block.items?.length || 3, 3)}`">
              <article v-for="(item, i) in block.items" :key="i" class="project-card">
                <div class="project-mockup" :class="item.variant || 'chat'">
                  <div v-html="projectMockup(item.variant)"></div>
                </div>
                <div class="project-body">
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.text }}</p>
                  <div v-if="item.tags?.length" class="tags">
                    <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </template>

        <!-- PACKAGES -->
        <template v-else-if="block.type === 'packages'">
          <div v-if="visiblePackages.length" class="container">
            <header class="section-title center">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2>{{ block.title || 'Kies een startpunt dat past bij je plan.' }}</h2>
            </header>
            <div class="package-grid" :class="`cols-${Math.min(visiblePackages.length, 3)}`">
              <article
                v-for="pkg in visiblePackages"
                :key="pkg.id || pkg.name"
                class="package-card"
                :class="{ highlighted: pkg.highlighted }"
              >
                <span v-if="pkg.highlighted" class="package-badge">Populair</span>
                <h3>{{ pkg.name }}</h3>
                <p>{{ pkg.description }}</p>
                <div class="price">
                  <strong>EUR {{ formatPrice(pkg.price) }}</strong>
                  <span>{{ pkg.period }}</span>
                </div>
                <ul>
                  <li v-for="feature in packageFeatures(pkg)" :key="feature">{{ feature }}</li>
                </ul>
                <router-link :to="packageQuoteTo(pkg)" class="btn" :class="pkg.highlighted ? 'btn-primary' : 'btn-ghost'">
                  {{ pkg.ctaLabel || 'Vraag offerte aan' }}
                </router-link>
              </article>
            </div>
          </div>
        </template>

        <!-- CTA -->
        <template v-else-if="block.type === 'cta'">
          <div class="container">
            <div class="cta-panel">
              <span class="cta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 9h18M8 3v4M16 3v4" /><circle cx="12" cy="14" r="1.4" fill="currentColor" stroke="none" /></svg>
              </span>
              <div>
                <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
                <h2 v-if="block.title">{{ block.title }}</h2>
                <div v-if="block.body" v-html="block.body"></div>
              </div>
              <router-link v-if="block.ctaLabel" :to="block.ctaUrl || '/contact'" class="btn btn-primary">
                {{ block.ctaLabel }}
              </router-link>
            </div>
          </div>
        </template>

        <!-- FEATURE (single, centered) -->
        <template v-else-if="block.type === 'feature'">
          <div class="container">
            <header class="section-title center">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2 v-if="block.title">{{ block.title }}</h2>
            </header>
            <div v-if="block.body" class="feature-body" v-html="block.body"></div>
            <div v-if="block.ctaLabel" class="feature-actions">
              <router-link :to="block.ctaUrl || '/contact'" class="btn btn-primary">{{ block.ctaLabel }}</router-link>
            </div>
          </div>
        </template>

        <!-- IMAGE-TEXT -->
        <template v-else-if="block.type === 'image-text'">
          <div class="container">
            <div class="image-text" :class="{ reverse: block.variant === 'image-right' }">
              <div v-if="block.imageUrl" class="image-text-image">
                <img :src="block.imageUrl" :alt="block.title || ''" />
              </div>
              <div class="image-text-content">
                <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
                <h2 v-if="block.title">{{ block.title }}</h2>
                <div v-if="block.body" v-html="block.body"></div>
                <router-link v-if="block.ctaLabel" :to="block.ctaUrl || '/contact'" class="btn btn-primary mt">
                  {{ block.ctaLabel }}
                </router-link>
              </div>
            </div>
          </div>
        </template>

        <!-- STATS -->
        <template v-else-if="block.type === 'stats'">
          <div class="container">
            <header v-if="block.title || block.subtitle" class="section-title center">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2 v-if="block.title">{{ block.title }}</h2>
            </header>
            <div class="stats-grid" :class="`cols-${Math.min(Math.max(block.items?.length || 3, 2), 4)}`">
              <div v-for="(item, i) in block.items" :key="i" class="stat-card">
                <strong class="stat-value">{{ item.value }}</strong>
                <span class="stat-label">{{ item.label }}</span>
                <p v-if="item.text" class="stat-text">{{ item.text }}</p>
              </div>
            </div>
          </div>
        </template>

        <!-- LOGOS -->
        <template v-else-if="block.type === 'logos'">
          <div class="container">
            <header v-if="block.title || block.subtitle" class="section-title center">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2 v-if="block.title">{{ block.title }}</h2>
            </header>
            <div class="logo-wall">
              <div v-for="(item, i) in block.items" :key="i" class="logo-item">
                <a v-if="item.url" :href="item.url" target="_blank" rel="noopener noreferrer">
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.label || ''" />
                  <span v-else>{{ item.label }}</span>
                </a>
                <template v-else>
                  <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.label || ''" />
                  <span v-else>{{ item.label }}</span>
                </template>
              </div>
            </div>
          </div>
        </template>

        <!-- FAQ -->
        <template v-else-if="block.type === 'faq'">
          <div class="container faq-container">
            <header v-if="block.title || block.subtitle" class="section-title center">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2 v-if="block.title">{{ block.title }}</h2>
            </header>
            <div class="faq-list">
              <details v-for="(item, i) in block.items" :key="i" class="faq-item">
                <summary>
                  <span>{{ item.question }}</span>
                  <svg class="faq-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </summary>
                <div class="faq-answer" v-html="item.answer"></div>
              </details>
            </div>
          </div>
        </template>

        <!-- OFFERTE CONFIGURATOR -->
        <template v-else-if="block.type === 'offerte'">
          <div class="container">
            <header v-if="block.title || block.subtitle" class="section-title">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2 v-if="block.title">{{ block.title }}</h2>
              <p v-if="block.body" class="offerte-lead" v-html="block.body"></p>
            </header>
            <QuoteConfigurator />
          </div>
        </template>

        <!-- QUOTE -->
        <template v-else-if="block.type === 'quote'">
          <div class="container">
            <blockquote class="quote-card">
              <svg class="quote-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v3l4-3V9a2 2 0 0 0-2-2zm10 0h-4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2v3l4-3V9a2 2 0 0 0-2-2z" fill="currentColor"/></svg>
              <p v-if="block.body" v-html="block.body"></p>
              <p v-else-if="block.title">{{ block.title }}</p>
              <footer v-if="block.subtitle">— {{ block.subtitle }}</footer>
            </blockquote>
          </div>
        </template>

        <!-- TEXT (fallback) -->
        <template v-else>
          <div class="container">
            <div class="text-block">
              <span v-if="block.subtitle" class="eyebrow">{{ block.subtitle }}</span>
              <h2 v-if="block.title">{{ block.title }}</h2>
              <div v-if="block.body" v-html="block.body"></div>
              <router-link v-if="block.ctaLabel" :to="block.ctaUrl || '/contact'" class="btn btn-primary mt">
                {{ block.ctaLabel }}
              </router-link>
            </div>
          </div>
        </template>
      </article>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSiteStore } from '../../stores/site'
import QuoteConfigurator from '../offerte/QuoteConfigurator.vue'

const props = defineProps({
  blocks: { type: Array, default: () => [] },
})

const site = useSiteStore()

const visiblePackages = computed(() => [...(site.packages || [])]
  .filter((pkg) => pkg.enabled !== false)
  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))

const widthSpan = { full: 12, twoThird: 8, half: 6, third: 4 }

const rows = computed(() => {
  const out = []
  let current = { key: '', blocks: [], used: 0 }
  let rowIndex = 0
  const flush = () => {
    if (current.blocks.length) {
      current.key = `row-${rowIndex++}`
      out.push(current)
      current = { key: '', blocks: [], used: 0 }
    }
  }
  for (const b of props.blocks) {
    const span = widthSpan[b.width] || 12
    if (span >= 12) {
      flush()
      out.push({ key: `solo-${b.id}`, blocks: [b], used: span })
      continue
    }
    if (current.used + span > 12) flush()
    current.blocks.push(b)
    current.used += span
  }
  flush()
  return out
})

function benefitCols(block) {
  const n = block.items?.length || 4
  if (n <= 2) return 2
  if (n === 3) return 3
  return 4
}

function iconClass(key) {
  const allowed = ['fast', 'live', 'safe', 'resp']
  return allowed.includes(key) ? key : 'fast'
}

function packageFeatures(pkg) {
  return String(pkg.features || '').split('\n').map((item) => item.trim()).filter(Boolean)
}

function formatPrice(price) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(Number(price || 0))
}

function packageQuoteTo(pkg) {
  return { path: '/offerte', query: { pakket: pkg.id || slugify(pkg.name) } }
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
}

function processIcon(key) {
  const icons = {
    chat: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16v10H8l-4 4z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M8 10h8M8 13h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none"><path d="m9 8-5 4 5 4M15 8l5 4-5 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none"><path d="M5 12.5 10 17l9-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    launch: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3c4 2 6 5 6 9 0 2-1 3-2 4l-1 4h-6l-1-4c-1-1-2-2-2-4 0-4 2-7 6-9z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="12" cy="10" r="1.6" fill="currentColor"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 6 6.4.6-4.9 4.4 1.5 6.4L12 17l-5.6 3.4 1.5-6.4L3 9.6 9.4 9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  }
  return icons[key] || icons.chat
}

function projectMockup(variant) {
  const mockups = {
    chat: `<div class="mock-chat">
      <div class="mock-msg left"><span></span><b></b></div>
      <div class="mock-msg right"><b></b></div>
      <div class="mock-msg left"><span></span><b class="short"></b></div>
      <div class="mock-msg right"><b class="long"></b></div>
      <div class="mock-msg typing"><span></span><b></b><b></b><b></b></div>
    </div>`,
    admin: `<div class="mock-admin">
      <div class="mock-side"><i></i><i></i><i></i><i></i></div>
      <div class="mock-main">
        <div class="mock-kpi"><i></i><i></i><i></i></div>
        <svg viewBox="0 0 200 70" preserveAspectRatio="none">
          <path d="M5 60 L40 40 L70 50 L100 20 L140 35 L175 15 L195 25" />
        </svg>
      </div>
    </div>`,
    shop: `<div class="mock-shop">
      <div class="mock-product"><div class="ph"></div><i></i><b></b></div>
      <div class="mock-product"><div class="ph"></div><i></i><b></b></div>
      <div class="mock-product"><div class="ph"></div><i></i><b></b></div>
      <div class="mock-product"><div class="ph"></div><i></i><b></b></div>
    </div>`,
  }
  return mockups[variant] || mockups.chat
}
</script>

<style scoped>
.home-blocks-flow {
  --bg: #f3eadb;
  --surface: #fffaf1;
  --text: #132033;
  --muted: #526172;
  --accent: #0f766e;
  --accent-2: #b56f16;
  --accent-dim: color-mix(in srgb, var(--accent) 11%, transparent);
  --accent-2-dim: color-mix(in srgb, var(--accent-2) 12%, transparent);
  --border: color-mix(in srgb, var(--text) 14%, transparent);
  --border-strong: color-mix(in srgb, var(--accent) 42%, transparent);
}

.block-row {
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--bg) 96%, var(--surface));
}
.block-row-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0;
}
.block-row-grid > .home-block { padding-block: 56px; }
.block-row-grid > .home-block .container { width: auto; padding-inline: 24px; }

.home-block { padding: 80px 0; position: relative; }
.home-block.block-width-twoThird { grid-column: span 8; }
.home-block.block-width-half { grid-column: span 6; }
.home-block.block-width-third { grid-column: span 4; }
.home-block.block-width-full { grid-column: span 12; }

.section-title { margin-bottom: 38px; }
.section-title.center { text-align: center; max-width: 720px; margin-inline: auto; margin-bottom: 38px; }
.section-title h2 { margin-top: 10px; }
.section-row {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

/* BENEFITS */
.benefit-grid {
  display: grid;
  gap: 24px;
}
.benefit-grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.benefit-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.benefit-grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.benefit-card {
  position: relative;
  display: grid;
  grid-template-columns: 58px 1fr;
  gap: 18px;
  padding: 24px 20px;
  min-height: 168px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface) 88%, transparent);
  box-shadow: 0 14px 30px color-mix(in srgb, var(--text) 8%, transparent);
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}
.benefit-card:hover { transform: translateY(-3px); border-color: var(--border-strong); background: var(--surface); }
.benefit-card h3 { margin-bottom: 8px; font-size: 1rem; }
.benefit-card p { color: var(--muted); font-size: 0.95rem; margin: 0; }
.benefit-icon {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  color: var(--accent);
}
.benefit-icon::before, .benefit-icon::after, .benefit-icon i {
  content: ""; position: absolute; display: block;
}
.benefit-icon.fast::before {
  width: 19px; height: 34px; background: var(--accent);
  clip-path: polygon(58% 0, 8% 55%, 44% 55%, 28% 100%, 94% 38%, 56% 38%);
}
.benefit-icon.live::before {
  width: 8px; height: 8px; border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 0 8px color-mix(in srgb, var(--accent) 18%, transparent), 0 0 0 17px color-mix(in srgb, var(--accent) 9%, transparent);
}
.benefit-icon.safe::before {
  width: 27px; height: 32px; border: 3px solid var(--accent); border-radius: 8px;
  clip-path: polygon(50% 0, 100% 20%, 88% 82%, 50% 100%, 12% 82%, 0 20%);
}
.benefit-icon.safe::after {
  width: 10px; height: 6px;
  border-left: 3px solid var(--accent); border-bottom: 3px solid var(--accent);
  transform: rotate(-45deg);
}
.benefit-icon.resp::before {
  width: 28px; height: 22px; border: 3px solid var(--accent); border-radius: 4px;
  left: 2px; top: 7px;
}
.benefit-icon.resp::after {
  width: 13px; height: 21px; border: 3px solid var(--accent); border-radius: 4px;
  right: 0; bottom: 4px; background: var(--bg);
}

/* PROCESS */
.steps {
  position: relative;
  display: grid;
  gap: 24px;
  margin-top: 48px;
}
.steps.cols-2 { grid-template-columns: repeat(2, 1fr); }
.steps.cols-3 { grid-template-columns: repeat(3, 1fr); }
.steps.cols-4 { grid-template-columns: repeat(4, 1fr); }
.step-card {
  position: relative; text-align: center;
  padding: 26px 22px 28px;
  min-height: 250px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  box-shadow: 0 14px 30px color-mix(in srgb, var(--text) 8%, transparent);
  transition: transform 0.2s ease, background 0.2s ease;
}
.step-card::before {
  content: ""; position: absolute; inset: 1px; border-radius: 7px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 8%, transparent), transparent 44%);
  pointer-events: none;
}
.step-card > * { position: relative; z-index: 1; }
.step-card:hover { transform: translateY(-3px); border-color: var(--border-strong); background: var(--surface); }
.step-card h3 { margin: 0 0 6px; }
.step-card p { color: var(--muted); font-size: 0.95rem; margin: 0; }
.step-number {
  display: grid; place-items: center;
  width: 34px; height: 34px;
  margin: -43px auto 24px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--text-inverse, #fff);
  font-weight: 800;
  box-shadow: 0 14px 28px color-mix(in srgb, var(--accent) 24%, transparent);
}
.step-icon {
  display: grid; place-items: center;
  width: 48px; height: 48px;
  margin: 0 auto 18px;
  border-radius: 8px;
  background: var(--accent-dim);
  color: var(--accent);
}
.step-icon :deep(svg) { width: 26px; height: 26px; }

/* PROJECTS */
.project-grid {
  display: grid;
  gap: 28px;
}
.project-grid.cols-1 { grid-template-columns: 1fr; }
.project-grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.project-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.project-card {
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
}
.project-card:hover { transform: translateY(-4px); border-color: var(--accent-dim); box-shadow: 0 18px 42px color-mix(in srgb, var(--text) 16%, transparent); }
.project-mockup {
  height: 200px; padding: 22px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 16%, var(--surface)), color-mix(in srgb, var(--bg) 94%, var(--accent)));
  border-bottom: 1px solid var(--border);
  overflow: hidden; position: relative;
}
.project-mockup.admin {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent-2) 14%, var(--surface)), color-mix(in srgb, var(--bg) 90%, var(--surface)));
}
.project-mockup.shop {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--surface)), color-mix(in srgb, var(--accent-2) 13%, var(--bg)));
}
.project-mockup :deep(.mock-chat) { display: flex; flex-direction: column; gap: 9px; }
.project-mockup :deep(.mock-msg) { display: flex; align-items: center; gap: 7px; }
.project-mockup :deep(.mock-msg.right) { justify-content: flex-end; }
.project-mockup :deep(.mock-msg span) { width: 18px; height: 18px; border-radius: 50%; background: color-mix(in srgb, var(--accent-2) 50%, var(--surface)); flex: 0 0 auto; }
.project-mockup :deep(.mock-msg b) { display: block; height: 14px; border-radius: 8px; background: color-mix(in srgb, var(--text) 22%, transparent); width: 110px; }
.project-mockup :deep(.mock-msg.right b) { background: var(--accent); width: 70px; }
.project-mockup :deep(.mock-msg b.short) { width: 60px; }
.project-mockup :deep(.mock-msg b.long) { width: 130px; }
.project-mockup :deep(.mock-msg.typing b) { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: dot 1.4s infinite ease-in-out; }
.project-mockup :deep(.mock-msg.typing b:nth-child(3)) { animation-delay: 0.2s; }
.project-mockup :deep(.mock-msg.typing b:nth-child(4)) { animation-delay: 0.4s; }
@keyframes dot { 0%, 80%, 100% { opacity: 0.3; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
.project-mockup :deep(.mock-admin) { display: grid; grid-template-columns: 36px 1fr; gap: 12px; height: 100%; }
.project-mockup :deep(.mock-side) { display: flex; flex-direction: column; gap: 7px; padding: 6px; background: color-mix(in srgb, var(--surface) 80%, transparent); border-radius: 8px; border: 1px solid var(--border); }
.project-mockup :deep(.mock-side i) { display: block; height: 8px; border-radius: 4px; background: color-mix(in srgb, var(--text) 18%, transparent); }
.project-mockup :deep(.mock-side i:first-child) { background: var(--accent); }
.project-mockup :deep(.mock-main) { display: flex; flex-direction: column; gap: 10px; }
.project-mockup :deep(.mock-kpi) { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.project-mockup :deep(.mock-kpi i) { display: block; height: 26px; border-radius: 6px; background: color-mix(in srgb, var(--surface) 90%, transparent); border: 1px solid var(--border); }
.project-mockup :deep(.mock-main svg) { width: 100%; flex: 1; }
.project-mockup :deep(.mock-main path) { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linecap: round; }
.project-mockup :deep(.mock-shop) { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.project-mockup :deep(.mock-product) { background: color-mix(in srgb, var(--surface) 90%, transparent); border: 1px solid var(--border); border-radius: 8px; padding: 6px; display: flex; flex-direction: column; gap: 4px; }
.project-mockup :deep(.mock-product .ph) { height: 36px; border-radius: 4px; background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 25%, transparent), color-mix(in srgb, var(--accent-2) 18%, transparent)); }
.project-mockup :deep(.mock-product i) { display: block; height: 6px; border-radius: 3px; background: color-mix(in srgb, var(--text) 22%, transparent); width: 70%; }
.project-mockup :deep(.mock-product b) { display: block; height: 6px; border-radius: 3px; background: var(--accent); width: 40%; }
.project-body { padding: 22px; }
.project-body h3 { margin-bottom: 6px; }
.project-body p { color: var(--muted); font-size: 0.95rem; margin: 0 0 16px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tags span { padding: 5px 11px; border-radius: 8px; background: color-mix(in srgb, var(--surface) 82%, var(--text)); color: var(--muted); font-size: 0.8rem; }

/* PACKAGES */
.package-grid {
  display: grid;
  gap: 28px;
  margin-top: 34px;
}
.package-grid.cols-1 { grid-template-columns: 1fr; }
.package-grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.package-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.package-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  box-shadow: 0 14px 30px color-mix(in srgb, var(--text) 8%, transparent);
}
.package-card.highlighted {
  border-color: var(--border-strong);
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent) 10%, var(--surface)), var(--surface));
  box-shadow: 0 14px 28px color-mix(in srgb, var(--accent) 24%, transparent);
}
.package-badge {
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--accent);
  color: var(--text-inverse, #fff);
  font-size: 0.76rem;
  font-weight: 800;
}
.package-card h3 { margin: 0; font-size: 1.35rem; }
.package-card p { color: var(--muted); line-height: 1.65; margin: 0; }
.price { display: flex; align-items: baseline; gap: 10px; }
.price strong { font-size: 2.3rem; font-family: var(--font-display, inherit); }
.price span { color: var(--muted); }
.package-card ul { display: grid; gap: 10px; padding: 0; margin: 0 0 6px; list-style: none; }
.package-card li::before { content: "+"; margin-right: 9px; color: var(--accent); }
.package-card .btn { margin-top: auto; justify-content: center; }

/* CTA */
.cta-panel {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 22px;
  align-items: center;
  padding: 28px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, var(--surface)), var(--surface));
}
.block-variant-highlight .cta-panel {
  background: linear-gradient(135deg, color-mix(in srgb, var(--accent) 18%, var(--surface)), var(--surface));
  box-shadow: 0 14px 28px color-mix(in srgb, var(--accent) 24%, transparent);
}

/* Variant: highlight — accent achtergrond op het hele blok */
.home-block.block-variant-highlight {
  background:
    radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 55%),
    radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--accent-2) 10%, transparent), transparent 55%),
    color-mix(in srgb, var(--surface) 96%, var(--accent));
  border-top: 1px solid var(--border-strong);
  border-bottom: 1px solid var(--border-strong);
}

/* Variant: quiet — rustig, transparant, minder padding */
.home-block.block-variant-quiet {
  background: transparent;
  padding-block: 56px;
}
.home-block.block-variant-quiet .benefit-card,
.home-block.block-variant-quiet .step-card,
.home-block.block-variant-quiet .stat-card,
.home-block.block-variant-quiet .project-card,
.home-block.block-variant-quiet .package-card {
  box-shadow: none;
  background: transparent;
}
.cta-icon {
  display: grid; place-items: center;
  width: 52px; height: 52px;
  border-radius: 8px;
  background: var(--accent-dim);
  color: var(--accent);
}
.cta-icon svg { width: 26px; height: 26px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
.cta-panel h2 { margin: 0 0 4px; font-size: 1.5rem; }
.cta-panel p { margin: 0; color: var(--muted); }
.cta-panel :deep(p) { margin: 0; color: var(--muted); }

/* TEXT / FEATURE */
.text-block { max-width: 760px; }
.text-block :deep(p) { color: var(--muted); margin: 0 0 1em; line-height: 1.75; }
.text-block .mt { margin-top: 18px; }
.feature-body {
  max-width: 720px;
  margin: 0 auto;
  text-align: center;
  color: var(--muted);
}
.feature-body :deep(p) { color: var(--muted); margin: 0 0 1em; line-height: 1.75; }
.feature-actions { margin-top: 24px; text-align: center; }

/* IMAGE-TEXT */
.image-text {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 56px;
  align-items: center;
}
.image-text.reverse { direction: rtl; }
.image-text.reverse > * { direction: ltr; }
.image-text-image img {
  width: 100%; height: auto;
  border-radius: 12px;
  border: 1px solid var(--border);
  box-shadow: 0 18px 42px color-mix(in srgb, var(--text) 12%, transparent);
}
.image-text-content :deep(p) { color: var(--muted); margin: 0 0 1em; line-height: 1.75; }
.image-text-content .mt { margin-top: 18px; }

/* STATS */
.stats-grid {
  display: grid;
  gap: 22px;
}
.stats-grid.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.stats-grid.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.stats-grid.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.stat-card {
  text-align: center;
  padding: 28px 22px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--text) 8%, transparent);
}
.stat-value {
  display: block;
  font-family: var(--font-display, inherit);
  font-size: clamp(2rem, 4vw, 2.8rem);
  font-weight: 800;
  color: var(--accent);
  line-height: 1;
}
.stat-label {
  display: block;
  margin-top: 8px;
  color: var(--text);
  font-weight: 600;
  font-size: 0.95rem;
}
.stat-text {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 0.85rem;
}

/* LOGOS */
.logo-wall {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 22px;
  align-items: center;
  justify-items: center;
}
.logo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 70px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface) 90%, transparent);
  transition: transform 0.2s ease, border-color 0.2s ease;
}
.logo-item:hover { transform: translateY(-2px); border-color: var(--border-strong); }
.logo-item img { max-height: 100%; max-width: 100%; object-fit: contain; opacity: 0.85; }
.logo-item:hover img { opacity: 1; }
.logo-item span { color: var(--muted); font-weight: 600; font-size: 0.92rem; }
.logo-item a {
  display: flex; align-items: center; justify-content: center;
  width: 100%; height: 100%; color: inherit;
}

/* FAQ */
.faq-container { max-width: 820px; }
.faq-list { display: flex; flex-direction: column; gap: 12px; }
.faq-item {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  overflow: hidden;
  transition: border-color 0.2s ease;
}
.faq-item[open] { border-color: var(--border-strong); }
.faq-item summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  cursor: pointer;
  font-weight: 600;
  color: var(--text);
  list-style: none;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-item summary:hover { color: var(--accent); }
.faq-chevron {
  width: 20px; height: 20px;
  flex-shrink: 0;
  color: var(--muted);
  transition: transform 0.2s ease;
}
.faq-item[open] .faq-chevron { transform: rotate(180deg); color: var(--accent); }
.faq-answer {
  padding: 0 20px 20px;
  color: var(--muted);
  line-height: 1.7;
}
.faq-answer :deep(p) { color: var(--muted); margin: 0 0 1em; }
.faq-answer :deep(p:last-child) { margin-bottom: 0; }
.faq-answer :deep(a) { color: var(--accent); }

/* OFFERTE in block */
.offerte-lead { color: var(--muted); margin: 12px 0 28px; max-width: 680px; }

/* QUOTE */
.quote-card {
  position: relative;
  max-width: 760px;
  margin: 0 auto;
  padding: 36px 38px;
  border: 1px solid var(--border-strong);
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-dim), color-mix(in srgb, var(--accent-2) 8%, var(--surface)));
}
.quote-card .quote-mark {
  width: 32px; height: 32px;
  color: var(--accent);
  margin-bottom: 8px;
}
.quote-card p {
  font-size: 1.18rem;
  line-height: 1.65;
  margin: 0 0 16px;
}
.quote-card footer {
  color: var(--muted);
  font-size: 0.92rem;
  font-weight: 600;
}

@media (max-width: 1040px) {
  .benefit-grid.cols-3, .benefit-grid.cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .steps.cols-3, .steps.cols-4 { grid-template-columns: repeat(2, 1fr); }
  .project-grid.cols-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .package-grid.cols-3 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .stats-grid.cols-3, .stats-grid.cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .image-text { grid-template-columns: 1fr; gap: 32px; }
}

@media (max-width: 760px) {
  .home-block { padding: 56px 0; }
  .block-row-grid { grid-template-columns: 1fr; }
  .home-block.block-width-twoThird,
  .home-block.block-width-half,
  .home-block.block-width-third { grid-column: span 1; }
  .benefit-grid.cols-2, .benefit-grid.cols-3, .benefit-grid.cols-4 { grid-template-columns: 1fr; }
  .steps.cols-2, .steps.cols-3, .steps.cols-4 { grid-template-columns: 1fr; }
  .project-grid.cols-2, .project-grid.cols-3 { grid-template-columns: 1fr; }
  .package-grid.cols-2, .package-grid.cols-3 { grid-template-columns: 1fr; }
  .stats-grid.cols-2, .stats-grid.cols-3, .stats-grid.cols-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cta-panel { grid-template-columns: 1fr; text-align: center; }
  .cta-icon { margin: 0 auto; }
  .cta-panel .btn { width: 100%; justify-content: center; }
  .section-row { flex-direction: column; align-items: flex-start; }
}
</style>
