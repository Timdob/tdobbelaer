<template>
  <div class="configurator card">
    <Bevestiging v-if="offerte.verzonden" @reset="resetConfigurator" />

    <template v-else-if="!showSummary">
      <StapIndicator
        :stap="offerte.huidigeStap"
        :labels="offerte.stepLabels"
        @select="offerte.naarStap"
      />

      <transition name="fade-slide" mode="out-in">
        <Stap1Branche v-if="offerte.huidigeStap === 1" key="stap-1" />
        <Stap2Wensen v-else-if="offerte.huidigeStap === 2" key="stap-2" />
        <Stap3Gegevens v-else key="stap-3" />
      </transition>

      <p v-if="status" class="status" :class="{ error: failed }">{{ status }}</p>

      <footer class="controls">
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="offerte.huidigeStap === 1 || loading"
          @click="offerte.vorigeStap"
        >
          Vorige
        </button>
        <button
          v-if="offerte.huidigeStap < 3"
          type="button"
          class="btn btn-primary"
          :disabled="!offerte.kanVerder"
          @click="next"
        >
          Volgende stap
        </button>
        <button
          v-else
          type="button"
          class="btn btn-primary"
          :disabled="loading"
          @click="goToSummary"
        >
          Controleer aanvraag →
        </button>
      </footer>
    </template>

    <!-- Samenvatting vóór verzenden -->
    <template v-else>
      <div class="summary">
        <span class="eyebrow">Bijna klaar</span>
        <h2>Controleer je aanvraag</h2>
        <p class="muted summary-lead">Klopt alles? Dan sturen we je aanvraag door.</p>

        <dl class="summary-grid">
          <dt>Branche</dt>
          <dd>{{ offerte.brancheLabel }}</dd>
          <dt>Wensen</dt>
          <dd>{{ offerte.wensenLabels.join(', ') }}</dd>
          <dt>Naam</dt>
          <dd>{{ offerte.gegevens.naam }}</dd>
          <dt>Bedrijf</dt>
          <dd>{{ offerte.gegevens.bedrijfsnaam }}</dd>
          <dt>E-mail</dt>
          <dd>{{ offerte.gegevens.email }}</dd>
          <dt v-if="offerte.gegevens.telefoon">Telefoon</dt>
          <dd v-if="offerte.gegevens.telefoon">{{ offerte.gegevens.telefoon }}</dd>
          <dt v-if="offerte.gegevens.extraInfo">Toelichting</dt>
          <dd v-if="offerte.gegevens.extraInfo">{{ offerte.gegevens.extraInfo }}</dd>
        </dl>

        <div class="summary-price">
          <span class="muted small">Richtprijs</span>
          <div class="price-range">
            <strong>€{{ format(offerte.prijsIndicatie.min) }}</strong>
            <span class="muted"> – </span>
            <strong>€{{ format(offerte.prijsIndicatie.max) }}</strong>
          </div>
          <span class="muted small">Definitieve prijs na gesprek op maat</span>
        </div>

        <p v-if="status" class="status" :class="{ error: failed }">{{ status }}</p>

        <footer class="controls">
          <button type="button" class="btn btn-ghost" @click="showSummary = false">Terug wijzigen</button>
          <button type="button" class="btn btn-primary" :disabled="loading" @click="submit">
            {{ loading ? 'Versturen...' : 'Aanvraag versturen' }}
          </button>
        </footer>
      </div>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue'
import { api } from '../../composables/api'
import Bevestiging from './Bevestiging.vue'
import StapIndicator from './StapIndicator.vue'
import Stap1Branche from './Stap1Branche.vue'
import Stap2Wensen from './Stap2Wensen.vue'
import Stap3Gegevens from './Stap3Gegevens.vue'
import { useOfferteStore } from '../../stores/offerte'
import { useSiteStore } from '../../stores/site'

const site = useSiteStore()
const offerte = useOfferteStore()
const loading = ref(false)
const status = ref('')
const failed = ref(false)
const showSummary = ref(false)

function format(n) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(n)
}

onMounted(() => {
  offerte.setConfig(site.settings?.quoteConfig)
})

watch(() => site.settings?.quoteConfig, (config) => offerte.setConfig(config), { immediate: true })

function next() {
  status.value = ''
  failed.value = false
  offerte.volgendeStap()
}

function goToSummary() {
  const validation = validate()
  status.value = validation
  failed.value = Boolean(validation)
  if (!validation) showSummary.value = true
}

function validate() {
  const g = offerte.gegevens
  if (!offerte.branche) return 'Kies eerst een branche.'
  if (!offerte.wensen.length) return 'Kies minimaal een wens.'
  if (!g.naam.trim()) return 'Vul je naam in.'
  if (!g.bedrijfsnaam.trim()) return 'Vul je bedrijfsnaam in.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email.trim())) return 'Vul een geldig e-mailadres in.'
  const missing = offerte.quoteConfig.extraQuestions.find((question) =>
    question.required && !String(g.extraAnswers?.[question.id] || '').trim())
  if (missing) return `Vul ${missing.label} in.`
  return ''
}

async function submit() {
  const validation = validate()
  status.value = validation
  failed.value = Boolean(validation)
  if (validation) return

  loading.value = true
  status.value = ''
  failed.value = false
  try {
    await api.post('/api/contact', {
      name: offerte.gegevens.naam.trim(),
      email: offerte.gegevens.email.trim(),
      phone: offerte.gegevens.telefoon.trim(),
      company: offerte.gegevens.bedrijfsnaam.trim(),
      subject: `Offerte aanvraag - ${offerte.pakketNaam}`,
      message: offerte.bouwBerichtBody(),
    })
    offerte.verzonden = true
  } catch (e) {
    failed.value = true
    status.value = e.message
  } finally {
    loading.value = false
  }
}

function resetConfigurator() {
  offerte.reset()
  status.value = ''
  failed.value = false
  showSummary.value = false
}
</script>

<style scoped>
.configurator { padding: clamp(22px, 4vw, 38px); }

.controls {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-top: 34px;
  padding-top: 22px;
  border-top: 1px solid var(--border);
}
.controls .btn { min-width: 150px; }
.controls .btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.status {
  margin: 28px 0 0;
  padding: 10px 12px;
  border-radius: var(--radius);
  border: 1px solid var(--info-border);
  background: var(--info-bg);
  color: var(--accent-2);
}
.status.error {
  border-color: var(--danger-border);
  background: var(--danger-bg);
  color: var(--danger);
}

.summary { padding: 8px 0 4px; }
.summary h2 { margin: 10px 0 4px; font-size: 1.5rem; }
.summary-lead { margin-bottom: 24px; }
.summary-grid {
  display: grid; grid-template-columns: 130px 1fr;
  gap: 10px 16px; margin-bottom: 24px;
  padding: 20px; border: 1px solid var(--border);
  border-radius: var(--radius-lg); background: var(--field-bg);
}
.summary-grid dt { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; padding-top: 2px; }
.summary-grid dd { margin: 0; font-size: 0.95rem; }
.summary-price {
  display: flex; flex-direction: column; gap: 4px;
  padding: 18px 20px; border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg); margin-bottom: 8px;
  background: radial-gradient(circle at 0 0, var(--accent-dim), transparent 60%), var(--surface);
}
.price-range { display: flex; align-items: baseline; gap: 4px; margin: 4px 0; }
.price-range strong { font-family: var(--font-display); font-size: 1.6rem; color: var(--accent); }

.fade-slide-enter-active, .fade-slide-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.fade-slide-enter-from { opacity: 0; transform: translateY(8px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }

@media (max-width: 720px) {
  .controls { flex-direction: column-reverse; }
  .controls .btn { width: 100%; }
}
</style>
