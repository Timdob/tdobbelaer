<template>
  <div class="stap3">
    <header class="stap-head">
      <span class="eyebrow">{{ step.eyebrow }}</span>
      <h2>{{ step.title }}</h2>
      <p class="lead">{{ step.lead }}</p>
    </header>

    <div class="layout">
      <form class="form" @submit.prevent>
        <div class="grid grid-2">
          <div>
            <label class="label">{{ fields.nameLabel }} *</label>
            <input v-model="g.naam" class="input" required autocomplete="name" />
          </div>
          <div>
            <label class="label">{{ fields.companyLabel }} *</label>
            <input v-model="g.bedrijfsnaam" class="input" required autocomplete="organization" />
          </div>
        </div>

        <div class="grid grid-2">
          <div>
            <label class="label">{{ fields.emailLabel }} *</label>
            <input v-model="g.email" type="email" class="input" required autocomplete="email" />
          </div>
          <div>
            <label class="label">{{ fields.phoneLabel }}</label>
            <input v-model="g.telefoon" class="input" autocomplete="tel" />
          </div>
        </div>

        <div class="grid grid-2">
          <div>
            <label class="label">{{ fields.hasWebsiteLabel }}</label>
            <div class="toggle">
              <button type="button" class="toggle-btn" :class="{ active: g.heeftWebsite === 'ja' }" @click="g.heeftWebsite = 'ja'">Ja</button>
              <button type="button" class="toggle-btn" :class="{ active: g.heeftWebsite === 'nee' }" @click="g.heeftWebsite = 'nee'">Nee</button>
            </div>
          </div>
          <div>
            <label class="label">{{ fields.liveLabel }}</label>
            <select v-model="g.wanneerLive" class="select">
              <option v-for="option in offerte.quoteConfig.liveOptions" :key="option">{{ option }}</option>
            </select>
          </div>
        </div>

        <div v-if="g.heeftWebsite === 'ja'">
          <label class="label">{{ fields.websiteUrlLabel }}</label>
          <input
            v-model="g.websiteUrl"
            type="url"
            class="input"
            placeholder="https://jouwdomein.nl"
            autocomplete="url"
          />
        </div>

        <div v-for="question in offerte.quoteConfig.extraQuestions" :key="question.id">
          <label class="label">{{ question.label }}{{ question.required ? ' *' : '' }}</label>
          <select
            v-if="question.type === 'select'"
            v-model="g.extraAnswers[question.id]"
            class="select"
            :required="question.required"
          >
            <option value="">Maak een keuze</option>
            <option v-for="option in question.options || []" :key="option">{{ option }}</option>
          </select>
          <textarea
            v-else-if="question.type === 'textarea'"
            v-model="g.extraAnswers[question.id]"
            class="textarea"
            rows="4"
            :required="question.required"
          />
          <input
            v-else
            v-model="g.extraAnswers[question.id]"
            class="input"
            :required="question.required"
          />
        </div>

        <div>
          <label class="label">{{ fields.extraInfoLabel }}</label>
          <textarea v-model="g.extraInfo" class="textarea" rows="5" :placeholder="fields.extraInfoPlaceholder" />
        </div>
      </form>

      <aside class="overview surface">
        <span class="eyebrow">Overzicht</span>
        <h3>Jouw aanvraag</h3>
        <dl>
          <dt>Branche</dt><dd>{{ offerte.brancheLabel || '-' }}</dd>
          <dt>Wensen</dt><dd>{{ offerte.wensenLabels.length ? offerte.wensenLabels.join(', ') : '-' }}</dd>
          <dt>{{ offerte.gekozenPakket ? 'Gekozen' : 'Pakket' }}</dt><dd><strong>{{ offerte.pakketNaam }}</strong></dd>
          <dt>Indicatie</dt><dd>&euro;{{ format(offerte.prijsIndicatie.min) }} - &euro;{{ format(offerte.prijsIndicatie.max) }}</dd>
        </dl>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useOfferteStore } from '../../stores/offerte'

const offerte = useOfferteStore()
const g = computed(() => offerte.gegevens)
const step = computed(() => offerte.quoteConfig.steps[2])
const fields = computed(() => offerte.fields)

function format(n) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(n)
}
</script>

<style scoped>
.stap-head { margin-bottom: 28px; max-width: 680px; }
.stap-head h2 { margin-top: 12px; }
.layout { display: grid; grid-template-columns: 1fr 320px; gap: 32px; align-items: start; }
.form { display: flex; flex-direction: column; gap: 18px; }
.toggle { display: flex; gap: 8px; }
.toggle-btn {
  flex: 1; padding: 11px 14px; border: 1px solid var(--border-2);
  background: var(--field-bg); color: var(--text); border-radius: var(--radius);
  font-family: var(--font); font-weight: 600; font-size: 0.9rem; cursor: pointer;
  transition: all 0.2s;
}
.toggle-btn.active { background: var(--accent); border-color: var(--accent); color: var(--text-inverse); }
.overview { padding: 24px; }
.overview h3 { margin: 8px 0 16px; }
dl { margin: 0; display: grid; grid-template-columns: 90px 1fr; gap: 8px 14px; }
dt { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; padding-top: 2px; }
dd { margin: 0; font-size: 0.92rem; line-height: 1.4; }
dd strong { color: var(--accent); }
@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
}
</style>
