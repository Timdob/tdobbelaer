<template>
  <div class="configurator card">
    <Bevestiging v-if="offerte.verzonden" @reset="resetConfigurator" />

    <template v-else>
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
          @click="submit"
        >
          {{ loading ? 'Versturen...' : 'Offerte aanvragen' }}
        </button>
      </footer>
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

onMounted(() => {
  offerte.setConfig(site.settings?.quoteConfig)
})

watch(() => site.settings?.quoteConfig, (config) => offerte.setConfig(config), { immediate: true })

function next() {
  status.value = ''
  failed.value = false
  offerte.volgendeStap()
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
