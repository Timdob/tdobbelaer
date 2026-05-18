<template>
  <aside class="prijs">
    <span class="eyebrow">Live prijsindicatie</span>
    <div class="amount">
      <span class="from">vanaf</span>
      <span class="big">&euro;{{ format(offerte.prijsIndicatie.min) }}</span>
      <span class="to">- &euro;{{ format(offerte.prijsIndicatie.max) }}</span>
    </div>
    <div class="pakket">
      <span class="label">{{ offerte.gekozenPakket ? 'Gekozen pakket' : 'Aanbevolen pakket' }}</span>
      <strong>{{ offerte.pakketNaam }}</strong>
    </div>
    <p class="muted small note">
      {{ offerte.gekozenPakket
        ? 'Pakketprijs als basis, extra wensen worden daar bovenop berekend. Definitieve prijs na gesprek op maat.'
        : 'Een ruwe schatting op basis van jouw keuzes. De definitieve prijs hangt af van de inhoud; je krijgt een offerte op maat.' }}
    </p>
  </aside>
</template>

<script setup>
import { useOfferteStore } from '../../stores/offerte'

const offerte = useOfferteStore()
function format(n) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(n)
}
</script>

<style scoped>
.prijs {
  position: sticky; top: 90px; padding: 26px; border-radius: var(--radius-lg);
  border: 1px solid var(--border-strong);
  background:
    radial-gradient(circle at 0% 0%, var(--accent-dim), transparent 60%),
    radial-gradient(circle at 100% 100%, var(--accent-2-dim), transparent 60%),
    var(--surface);
  box-shadow: var(--shadow);
}
.amount { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-top: 10px; }
.from { color: var(--muted); font-size: 0.85rem; }
.big { font-family: var(--font-display); font-size: 2.2rem; font-weight: 700; color: var(--text); transition: color 0.3s; }
.to { color: var(--muted); font-size: 1rem; }
.pakket { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); }
.pakket .label {
  display: block; font-size: 0.7rem; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 4px;
}
.pakket strong { font-family: var(--font-display); font-size: 1.4rem; color: var(--accent); }
.note { margin-top: 18px; line-height: 1.55; }
</style>
