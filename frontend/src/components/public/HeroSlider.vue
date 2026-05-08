<template>
  <section class="hero-shell" @mouseenter="pause" @mouseleave="resume">
    <div class="container hero-frame">
      <transition name="fade" mode="out-in">
        <article :key="currentSlide.id || active" class="slide">
          <div class="copy-panel">
            <span v-if="currentSlide.badge" class="eyebrow">{{ currentSlide.badge }}</span>
            <h1>{{ currentSlide.title }}</h1>
            <p class="lead">{{ currentSlide.subtitle }}</p>
            <div class="actions">
              <a v-if="currentSlide.ctaLabel" :href="currentSlide.ctaUrl || '/contact'" class="btn btn-primary">
                {{ currentSlide.ctaLabel }}
              </a>
              <router-link to="/offerte" class="btn btn-ghost">Gratis offerte</router-link>
            </div>
          </div>

          <aside class="visual">
            <div class="orb orb-1"></div>
            <div class="orb orb-2"></div>
            <div class="orb orb-3"></div>
            <div class="ring ring-1"></div>
            <div class="ring ring-2"></div>
            <div class="visual-card surface">
              <span class="visual-eyebrow">{{ currentSlide.visualLabel || 'Live CMS' }}</span>
              <h3>{{ currentSlide.visualTitle || 'Beheer alles vanuit admin' }}</h3>
              <ul>
                <li v-for="(item, i) in visualItems" :key="i">{{ item }}</li>
              </ul>
            </div>
          </aside>
        </article>
      </transition>

      <div class="hero-controls" v-if="slides.length > 1">
        <button
          v-for="(s, i) in slides"
          :key="s.id || i"
          class="dot"
          :class="{ active: i === active }"
          @click="select(i)"
          :aria-label="`Slide ${i + 1}`"
        ></button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  slides: { type: Array, default: () => [] },
})

const AUTO_CYCLE_MS = 5500
const active = ref(0)
let timer = null
let paused = false

const fallback = {
  title: 'Websites die je merk vooruit helpen.',
  subtitle: 'Een snelle, beheerbare site die je vanuit admin volledig zelf aanstuurt.',
  badge: 'Maatwerk websites',
  ctaLabel: 'Project bespreken',
  ctaUrl: '/contact',
  visualLabel: 'Live CMS',
  visualTitle: 'Elke sectie is beheerbaar',
  visualItems: 'Design\nDevelopment\nBeheer',
}

const currentSlide = computed(() => props.slides[active.value] || props.slides[0] || fallback)

const visualItems = computed(() => {
  const raw = currentSlide.value.visualItems
  if (Array.isArray(raw)) return raw
  return String(raw || '').split('\n').map((s) => s.trim()).filter(Boolean)
})

function start() {
  stop()
  if (props.slides.length <= 1 || paused) return
  timer = setInterval(() => {
    active.value = (active.value + 1) % props.slides.length
  }, AUTO_CYCLE_MS)
}
function stop() { if (timer) { clearInterval(timer); timer = null } }
function pause() { paused = true; stop() }
function resume() { paused = false; start() }
function select(i) { active.value = i; start() }

onMounted(start)
onBeforeUnmount(stop)
</script>

<style scoped>
.hero-shell { padding: 60px 0 40px; }
.hero-frame {
  position: relative;
  min-height: 560px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 12%, var(--accent-dim), transparent 45%),
    radial-gradient(circle at 88% 88%, var(--accent-2-dim), transparent 45%),
    var(--surface);
  box-shadow: var(--shadow);
}
.slide {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 0.85fr);
  gap: 48px;
  align-items: center;
  padding: clamp(32px, 4vw, 60px);
  min-height: 560px;
}
.copy-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 620px;
}
.copy-panel h1 {
  margin-top: 14px;
  font-size: clamp(2.4rem, 4.6vw, 3.8rem);
  line-height: 1.06;
}
.copy-panel .lead {
  margin-top: 12px;
  font-size: 1.08rem;
  color: var(--muted);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 28px;
}

.visual {
  position: relative;
  height: 100%;
  min-height: 380px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
  will-change: transform, opacity;
}
.orb-1 {
  width: 280px; height: 280px;
  background: radial-gradient(circle, var(--accent), transparent 70%);
  top: 10%; left: 8%;
  animation: pulse 4s ease-in-out infinite;
  opacity: 0.7;
}
.orb-2 {
  width: 220px; height: 220px;
  background: radial-gradient(circle, var(--accent-2), transparent 70%);
  bottom: 12%; right: 6%;
  animation: pulse 5s ease-in-out infinite 0.6s;
  opacity: 0.65;
}
.orb-3 {
  width: 160px; height: 160px;
  background: radial-gradient(circle, color-mix(in srgb, var(--accent) 60%, var(--accent-2)), transparent 70%);
  top: 50%; left: 40%;
  animation: pulse 6s ease-in-out infinite 1.2s;
  opacity: 0.5;
}
.ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid var(--border-2);
  pointer-events: none;
}
.ring-1 { width: 320px; height: 320px; top: 50%; left: 50%; transform: translate(-50%, -50%); animation: spin 28s linear infinite; }
.ring-2 { width: 460px; height: 460px; top: 50%; left: 50%; transform: translate(-50%, -50%); border-style: dashed; opacity: 0.5; animation: spin 38s linear infinite reverse; }

.visual-card {
  position: relative;
  z-index: 2;
  width: min(280px, 80%);
  padding: 22px;
  backdrop-filter: blur(8px);
  background: color-mix(in srgb, var(--surface) 85%, transparent);
}
.visual-eyebrow {
  display: inline-block;
  color: var(--accent-2);
  font-size: 0.66rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-weight: 700;
}
.visual-card h3 {
  margin: 10px 0 14px;
  font-size: 1.05rem;
  line-height: 1.3;
}
.visual-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.visual-card li {
  font-size: 0.86rem;
  color: var(--muted);
  padding-left: 18px;
  position: relative;
}
.visual-card li::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent-2);
  box-shadow: var(--glow-2);
}

.hero-controls {
  position: absolute;
  z-index: 3;
  left: clamp(32px, 5vw, 60px);
  bottom: 28px;
  display: flex;
  gap: 10px;
}
.dot {
  width: 32px; height: 4px;
  border: 0; padding: 0;
  border-radius: 999px;
  background: var(--muted-2);
  cursor: pointer;
  transition: background 0.2s, width 0.2s;
}
.dot.active {
  background: var(--accent);
  width: 56px;
  box-shadow: var(--glow);
}
.dot:hover { background: var(--accent-2); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50%      { transform: scale(1.15); opacity: 0.85; }
}
@keyframes spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .orb, .ring { animation: none; }
}

@media (max-width: 900px) {
  .slide {
    grid-template-columns: 1fr;
    min-height: auto;
    padding: 36px 24px;
  }
  .visual { min-height: 320px; }
  .hero-controls { position: static; margin-top: 24px; justify-content: center; }
}
</style>
