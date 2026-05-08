<template>
  <footer class="footer">
    <div class="container footer-grid">
      <div class="brand-col">
        <router-link to="/" class="footer-brand">
          <span>TD/</span>
          <strong>TD Development</strong>
        </router-link>
        <p>
          Ik bouw moderne, snelle en schaalbare websites op maat met focus op prestaties,
          beheerbaarheid en groei.
        </p>
        <div v-if="socialLinks.length" class="socials" aria-label="Social links">
          <a
            v-for="link in socialLinks"
            :key="link.label"
            :href="link.url"
            :aria-label="link.label"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ link.short }}
          </a>
        </div>
      </div>

      <div>
        <h4>Navigatie</h4>
        <a href="/#home">Home</a>
        <a href="/#diensten">Diensten</a>
        <a href="/#werkwijze">Werkwijze</a>
        <a href="/#projecten">Projecten</a>
        <a href="/#over-mij">Over mij</a>
        <router-link to="/contact">Contact</router-link>
      </div>

      <div>
        <h4>Diensten</h4>
        <router-link to="/offerte">Websites op maat</router-link>
        <router-link to="/offerte">Webapplicaties</router-link>
        <router-link to="/offerte">Realtime apps</router-link>
        <router-link to="/offerte">API development</router-link>
        <router-link to="/offerte">Onderhoud & support</router-link>
      </div>

      <div>
        <h4>Contact</h4>
        <a :href="`mailto:${s?.contactEmail || 'info@td-development.nl'}`">
          {{ s?.contactEmail || 'info@td-development.nl' }}
        </a>
        <a v-if="s?.phone" :href="`tel:${s.phone}`">{{ s.phone }}</a>
        <span>{{ s?.address || 'Nederland' }}</span>
        <span class="available">Beschikbaar voor nieuwe projecten</span>
      </div>
    </div>

    <div class="container bottom">
      <span>{{ s?.footerText || `© ${new Date().getFullYear()} TD Development. Alle rechten voorbehouden.` }}</span>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { useSiteStore } from '../../stores/site'

const site = useSiteStore()
const s = computed(() => site.settings)
const socialLinks = computed(() => {
  const settings = s.value || {}
  return [
    { label: 'GitHub', short: 'GH', url: settings.socialGithub },
    { label: 'LinkedIn', short: 'IN', url: settings.socialLinkedin },
    { label: 'Instagram', short: 'IG', url: settings.socialInstagram },
  ].filter((link) => String(link.url || '').trim())
})
</script>

<style scoped>
.footer {
  margin-top: 0;
  padding: 34px 0 22px;
  border-top: 1px solid var(--border);
  background: color-mix(in srgb, var(--surface) 90%, var(--bg));
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.3fr 0.8fr 0.9fr 1fr;
  gap: 46px;
}
.footer-grid > div {
  display: flex;
  flex-direction: column;
  gap: 9px;
}
.footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.footer-brand span {
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 1.45rem;
  font-weight: 900;
}
.footer-brand strong {
  color: var(--text);
  font-family: var(--font-display);
}
.brand-col p {
  max-width: 290px;
  color: var(--muted);
  font-size: 0.92rem;
}
h4 {
  margin: 0 0 8px;
  color: var(--text);
  font-size: 0.95rem;
}
a,
span {
  color: var(--muted);
  font-size: 0.9rem;
}
a:hover {
  color: var(--accent-2);
}
.socials {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}
.socials a {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text);
  font-size: 0.72rem;
  font-weight: 800;
}
.available {
  margin-top: 8px;
  color: var(--success);
}
.available::before {
  content: "";
  display: inline-block;
  width: 7px;
  height: 7px;
  margin-right: 8px;
  border-radius: 50%;
  background: var(--success);
}
.bottom {
  margin-top: 34px;
  padding-top: 18px;
  border-top: 1px solid var(--border);
  text-align: center;
}
.bottom span {
  font-size: 0.82rem;
}
@media (max-width: 900px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 620px) {
  .footer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
