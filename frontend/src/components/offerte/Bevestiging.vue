<template>
  <div class="bevestiging">
    <div class="message surface">
      <div class="check">OK</div>
      <span class="eyebrow">Verstuurd</span>
      <h2>Bedankt, {{ offerte.gegevens.naam || 'we zijn ermee aan de slag' }}.</h2>
      <p class="lead">
        Je aanvraag voor pakket <strong>{{ offerte.pakketNaam }}</strong> is binnen.
        Ik neem binnen 1 werkdag contact met je op via {{ offerte.gegevens.email || 'je e-mail' }}.
      </p>

      <dl class="recap">
        <dt>Branche</dt><dd>{{ offerte.brancheLabel }}</dd>
        <dt>Wensen</dt><dd>{{ offerte.wensenLabels.join(', ') }}</dd>
        <dt>Indicatie</dt><dd>&euro;{{ format(offerte.prijsIndicatie.min) }} - &euro;{{ format(offerte.prijsIndicatie.max) }}</dd>
      </dl>

      <div class="actions">
        <router-link to="/" class="btn btn-primary">Terug naar home</router-link>
        <button type="button" class="btn btn-ghost" @click="$emit('reset')">Nieuwe aanvraag</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useOfferteStore } from '../../stores/offerte'

const offerte = useOfferteStore()
defineEmits(['reset'])

function format(n) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(n)
}
</script>

<style scoped>
.bevestiging { position: relative; padding: 34px 0 52px; }
.message {
  position: relative; max-width: 640px; margin: 0 auto; padding: 48px; text-align: center;
  border-color: var(--border-strong);
  background:
    radial-gradient(circle at 50% 0%, var(--accent-dim), transparent 70%),
    var(--surface);
}
.check {
  display: grid; place-items: center; width: 64px; height: 64px; margin: 0 auto 18px;
  border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent-2));
  color: var(--text-inverse); font-size: 1rem; font-weight: 800; box-shadow: var(--glow);
}
.message h2 { margin: 12px 0 14px; }
.recap {
  margin: 28px auto 0; text-align: left; display: grid;
  grid-template-columns: 110px 1fr; gap: 8px 16px; max-width: 440px;
}
.recap dt { color: var(--muted); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; padding-top: 2px; }
.recap dd { margin: 0; font-size: 0.94rem; }
.actions { display: flex; justify-content: center; gap: 12px; margin-top: 32px; flex-wrap: wrap; }
</style>
