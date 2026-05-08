<template>
  <section class="quote section">
    <div class="container">
      <header class="quote-head">
        <span class="eyebrow">Gratis offerte</span>
        <h1>{{ page?.title || 'Stel je website samen.' }}</h1>
        <p class="lead">
          {{ page?.excerpt || 'Beantwoord drie korte stappen en ontvang een voorstel dat past bij jouw bedrijf.' }}
        </p>
        <div v-if="page?.body" class="body" v-html="page.body"></div>
        <div v-if="offerte.gekozenPakket" class="chosen-package">
          <span>Gekozen pakket</span>
          <strong>{{ offerte.gekozenPakket.name }}</strong>
          <em v-if="offerte.gekozenPakket.price">
            EUR {{ formatPrice(offerte.gekozenPakket.price) }} {{ offerte.gekozenPakket.period }}
          </em>
        </div>
      </header>

      <QuoteConfigurator />
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import QuoteConfigurator from '../components/offerte/QuoteConfigurator.vue'
import { useOfferteStore } from '../stores/offerte'
import { useSiteStore } from '../stores/site'

const route = useRoute()
const site = useSiteStore()
const offerte = useOfferteStore()
const page = computed(() => site.pageBySlug('offerte'))

onMounted(() => {
  applyPackageFromQuery()
})

watch(() => route.query, applyPackageFromQuery)

function applyPackageFromQuery() {
  const raw = String(route.query.pkg || route.query.id || route.query.pakket || '').trim()
  const value = raw.toLowerCase()
  if (!value) return

  const pkg = site.packages.find((p) =>
    String(p.id).toLowerCase() === value ||
    String(p.name).toLowerCase() === value ||
    slugify(p.name) === value,
  )
  offerte.setPakket(pkg || { id: raw, name: raw })
  if (offerte.wensen.length) return

  const name = String(pkg?.name || value).toLowerCase()

  if (name.includes('starter')) {
    ;['website', 'portfolio'].forEach(addWens)
  } else if (name.includes('business')) {
    ;['website', 'portfolio', 'blog'].forEach(addWens)
  } else if (name.includes('premium') || name.includes('growth') || name.includes('enterprise')) {
    ;['website', 'klantportaal', 'reserveringen'].forEach(addWens)
  }
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '')
}

function addWens(id) {
  if (!offerte.wensen.includes(id)) offerte.wensen.push(id)
}

function formatPrice(price) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 }).format(Number(price || 0))
}
</script>

<style scoped>
.quote-head {
  max-width: 760px;
  margin-bottom: 34px;
}
.quote-head h1 { margin-top: 14px; }
.body {
  margin-top: 20px;
  max-width: 680px;
}
.body :deep(p) { color: var(--muted); line-height: 1.75; }
.body :deep(a) { color: var(--accent); border-bottom: 1px solid currentColor; }
.chosen-package {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 22px;
  padding: 12px 14px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  background: var(--accent-dim);
}
.chosen-package span {
  color: var(--muted);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.chosen-package strong {
  color: var(--text);
}
.chosen-package em {
  color: var(--accent-2);
  font-style: normal;
}

</style>
