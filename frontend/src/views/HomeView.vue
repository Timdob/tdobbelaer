<template>
  <div class="home-page">
    <section id="home" class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <span class="eyebrow">Websites op maat</span>
          <h1>{{ heroTitle.before }}<span>{{ heroTitle.highlight }}</span>{{ heroTitle.after }}</h1>
          <p class="lead">{{ activeHero.subtitle }}</p>
          <div class="hero-actions">
            <router-link :to="activeHero.ctaUrl || '/contact'" class="btn btn-primary">
              {{ activeHero.ctaLabel || 'Plan een gratis gesprek' }}
              <svg class="btn-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" /></svg>
            </router-link>
            <router-link to="/contact" class="btn btn-ghost">Plan een gesprek</router-link>
          </div>
          <div class="tech-row" aria-label="Technologieen">
            <div v-for="tech in techStack" :key="tech.name" class="tech-pill">
              <span class="tech-logo" v-html="tech.svg" aria-hidden="true"></span>
              <strong>{{ tech.name }}</strong>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="visual-glow"></div>
          <div class="dashboard">
            <div class="window-bar">
              <span></span><span></span><span></span>
              <small class="window-host">app.td-development.nl</small>
            </div>
            <div class="dashboard-body">
              <aside>
                <strong>Dashboard</strong>
                <span class="active">Overzicht</span>
                <span>Statistieken</span>
                <span>Berichten</span>
                <span>Gebruikers</span>
                <span>Instellingen</span>
              </aside>
              <main>
                <div class="metrics">
                  <div><small>Gebruikers</small><strong>1.248</strong><em>+12%</em></div>
                  <div><small>Berichten</small><strong>532</strong><em>+8%</em></div>
                  <div><small>Actief nu</small><strong>23</strong><em>+5%</em></div>
                </div>
                <div class="dashboard-grid">
                  <div class="chart-card">
                    <small>Verkeer (7d)</small>
                    <svg viewBox="0 0 260 130" role="img" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stop-color="var(--accent)" stop-opacity="0.45" />
                          <stop offset="100%" stop-color="var(--accent)" stop-opacity="0" />
                        </linearGradient>
                      </defs>
                      <path class="chart-area" d="M10 96 C35 16 58 26 75 84 S116 116 134 52 S172 44 188 72 S220 38 250 54 L250 130 L10 130 Z" />
                      <path class="chart-line" d="M10 96 C35 16 58 26 75 84 S116 116 134 52 S172 44 188 72 S220 38 250 54" />
                    </svg>
                  </div>
                  <div class="message-card">
                    <small>Realtime activiteit</small>
                    <p v-for="line in terminalLines" :key="line"><span></span> {{ line }}</p>
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </section>

    <HomeBlocks :blocks="visibleBlocks" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSiteStore } from '../stores/site'
import HomeBlocks from '../components/public/HomeBlocks.vue'

const site = useSiteStore()

const fallbackHero = {
  title: 'Ik bouw snelle, moderne & schaalbare websites op maat.',
  subtitle: 'Van idee tot live website. Ik ontwikkel snelle, moderne en schaalbare webapplicaties met Vue, Node.js, Express en realtime functionaliteit.',
  ctaLabel: 'Plan een gratis gesprek',
  ctaUrl: '/contact',
  terminalText: 'Nieuwe bestelling geplaatst\nBericht verzonden\nProduct bijgewerkt\nAccount aangemaakt',
}

const activeHero = computed(() => site.heroSlides?.[0] || fallbackHero)
const heroTitle = computed(() => {
  const title = activeHero.value.title || fallbackHero.title
  const match = title.match(/^(.*?)(moderne\s*&\s*schaalbare|schaalbare|moderne)(.*)$/i)
  if (!match) return { before: title, highlight: '', after: '' }
  return { before: match[1], highlight: match[2], after: match[3] }
})
const terminalLines = computed(() => String(activeHero.value.terminalText || fallbackHero.terminalText)
  .split('\n')
  .map((line) => line.replace(/^>\s*/, '').trim())
  .filter(Boolean)
  .slice(0, 4))
const visibleBlocks = computed(() => [...(site.blocks || [])]
  .filter((block) => block.enabled !== false)
  .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)))

const techStack = [
  {
    name: 'Node.js',
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 2.5 28.5 9.75v12.5L16 29.5 3.5 22.25V9.75z" stroke="#6cc24a" stroke-width="1.6" stroke-linejoin="round"/>
      <path d="M11.6 12.4v6.2c0 .8-.4 1.3-1.1 1.3-.4 0-.8-.1-1.1-.4M14.4 17.7c0 1.5 1.2 2.5 3 2.5 1.7 0 2.8-.8 2.8-2 0-1.1-.6-1.7-2.4-2.1-1.6-.4-2.2-.7-2.2-1.5 0-.8.7-1.3 1.9-1.3 1.1 0 1.9.5 2.1 1.4" stroke="#6cc24a" stroke-width="1.4" stroke-linecap="round"/>
    </svg>`,
  },
  {
    name: 'Express',
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 9.5h6.4c2.3 0 3.7 1.5 3.7 3.6 0 2-1.4 3.5-3.7 3.5H6v6h-3z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" fill="none" transform="translate(0 0)" />
      <path d="M5 11h7l-7 11h7M14 11h12M14 22h12M19 16.5h7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
    </svg>`,
  },
  {
    name: 'Vue.js',
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 6h6l7 12 7-12h6L16 28z" fill="#41b883"/>
      <path d="M9 6h4l3 5 3-5h4l-7 12z" fill="#34495e"/>
    </svg>`,
  },
  {
    name: 'Socket.io',
    svg: `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="13" stroke="currentColor" stroke-width="1.6"/>
      <path d="M9 18c4-7 10-7 14 0" stroke="var(--accent-2)" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M12 20c2.5-3.5 5.5-3.5 8 0" stroke="var(--accent-2)" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="16" cy="22" r="1.6" fill="var(--accent-2)"/>
    </svg>`,
  },
]

</script>

<style scoped>
.home-page {
  --bg: #f3eadb;
  --surface: #fffaf1;
  --text: #132033;
  --muted: #526172;
  --accent: #0f766e;
  --accent-2: #b56f16;
  --accent-dim: color-mix(in srgb, var(--accent) 11%, transparent);
  --accent-2-dim: color-mix(in srgb, var(--accent-2) 12%, transparent);
  --border: color-mix(in srgb, var(--text) 14%, transparent);
  --border-2: color-mix(in srgb, var(--text) 24%, transparent);
  --border-strong: color-mix(in srgb, var(--accent) 42%, transparent);
  overflow: hidden;
}
.hero {
  position: relative;
  padding: 74px 0 64px;
  border-bottom: 1px solid var(--border);
  background:
    linear-gradient(110deg, color-mix(in srgb, var(--surface) 98%, transparent) 0%, color-mix(in srgb, var(--bg) 92%, transparent) 52%, color-mix(in srgb, var(--accent) 13%, var(--surface)) 100%),
    radial-gradient(circle at 82% 28%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 34%);
}
.hero::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: 34px 34px;
  mask-image: linear-gradient(180deg, black 0%, transparent 82%);
  opacity: 0.22;
  pointer-events: none;
}
.hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(460px, 0.9fr) minmax(650px, 1.1fr);
  gap: clamp(44px, 5vw, 82px);
  align-items: center;
}
.hero-copy {
  padding-top: 8px;
}
.hero-copy h1 {
  max-width: 720px;
  margin-top: 16px;
  font-size: clamp(3.1rem, 5.2vw, 5.35rem);
  line-height: 1.03;
  letter-spacing: -0.035em;
  text-wrap: balance;
  color: var(--text);
}
.hero-copy h1 span {
  display: inline;
  color: var(--accent);
  text-shadow: none;
}
.hero-copy .lead {
  max-width: 630px;
  margin-top: 20px;
  font-size: 1.14rem;
  line-height: 1.85;
  color: var(--muted);
}
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 30px;
}
.hero-actions .btn {
  min-height: 58px;
  padding-inline: 26px;
  border-radius: 11px;
}
.btn-arrow {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
  transition: transform 0.2s ease;
}
.btn:hover .btn-arrow {
  transform: translateX(3px);
}
.tech-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(148px, 1fr));
  gap: 18px;
  margin-top: 28px;
  max-width: 720px;
}
.tech-pill {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 70px;
  padding: 15px 18px;
  background: color-mix(in srgb, var(--surface) 92%, transparent);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 12px 28px color-mix(in srgb, var(--text) 8%, transparent);
}
.tech-logo {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
  color: var(--text);
}
.tech-logo :deep(svg) { width: 100%; height: 100%; }
.tech-pill strong {
  color: var(--text);
  font-size: 0.94rem;
  line-height: 1;
  white-space: nowrap;
  min-width: 0;
}
.hero-visual {
  position: relative;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0;
}
.visual-glow {
  position: absolute;
  width: 460px;
  height: 460px;
  border-radius: 50%;
  background:
    radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent), transparent 64%),
    radial-gradient(circle at 70% 72%, color-mix(in srgb, var(--accent-2) 14%, transparent), transparent 58%);
  filter: blur(36px);
  opacity: 0.5;
}
.dashboard {
  position: relative;
  z-index: 2;
  width: min(780px, 100%);
  min-height: 420px;
  border: 1px solid var(--border-2);
  border-radius: 8px;
  background: var(--surface);
  box-shadow:
    0 34px 80px color-mix(in srgb, var(--text) 18%, transparent),
    inset 0 1px 0 color-mix(in srgb, #ffffff 70%, transparent);
  transform: perspective(1300px) rotateY(-6deg) rotateX(2deg) rotateZ(-1deg);
  overflow: hidden;
}
.window-bar {
  height: 44px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 18px;
  border-bottom: 1px solid var(--border);
}
.window-bar span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}
.window-bar span:nth-child(1) { background: #ff5f57; }
.window-bar span:nth-child(2) { background: #ffbd2e; }
.window-bar span:nth-child(3) { background: #28c940; }
.window-host {
  margin-left: 14px;
  color: var(--muted);
  font-size: 0.74rem;
  letter-spacing: 0.02em;
}
.dashboard-body {
  display: grid;
  grid-template-columns: 150px 1fr;
  min-height: 376px;
}
.dashboard aside {
  padding: 22px 18px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dashboard aside strong {
  margin-bottom: 10px;
  color: var(--text);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
}
.dashboard aside span {
  padding: 9px 12px;
  border-radius: 8px;
  color: var(--muted);
  font-size: 0.78rem;
}
.dashboard aside .active {
  color: var(--text-inverse);
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 78%, #083d38));
}
.dashboard main {
  padding: 22px 26px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}
.metrics div,
.chart-card,
.message-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #fffdf8;
  padding: 16px;
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text) 4%, transparent);
}
.metrics small,
.chart-card small,
.message-card small {
  display: block;
  color: var(--muted);
  margin-bottom: 8px;
  font-size: 0.74rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.metrics strong {
  display: block;
  font-size: 1.65rem;
  font-family: var(--font-display);
}
.metrics em {
  color: var(--success);
  font-size: 0.78rem;
  font-style: normal;
}
.dashboard-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16px;
}
.chart-card svg {
  width: 100%;
  height: 130px;
  display: block;
}
.chart-card .chart-line {
  fill: none;
  stroke: var(--accent);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: none;
}
.chart-card .chart-area {
  fill: url(#chartFill);
  stroke: none;
}
.message-card p {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.78rem;
  margin-bottom: 10px;
  color: var(--muted);
}
.message-card p:last-child { margin-bottom: 0; }
.message-card p span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 16%, transparent);
}
@media (max-width: 1040px) {
  .hero-grid { grid-template-columns: 1fr 1fr; gap: 44px; }
  .hero-visual { min-height: 440px; }
}
@media (max-width: 760px) {
  .hero { padding: 36px 0 32px; }
  .hero-grid { grid-template-columns: 1fr; gap: 24px; }
  .hero-copy { padding-top: 0; }
  .hero-copy h1 { font-size: 2.05rem; margin-top: 10px; }
  .hero-copy .lead { margin-top: 14px; font-size: 1rem; line-height: 1.6; }
  .hero-actions { margin-top: 22px; gap: 10px; }
  .hero-actions .btn { min-height: 50px; padding-inline: 20px; flex: 1 1 auto; }
  .tech-row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 22px; max-width: none; }
  .tech-pill { min-height: 56px; padding: 10px 12px; gap: 9px; }
  .tech-logo { width: 26px; height: 26px; }
  .tech-pill strong { font-size: 0.86rem; }
  .hero-visual { display: none; }
}
</style>
