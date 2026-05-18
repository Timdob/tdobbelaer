<template>
  <div>
    <header class="head">
      <div>
        <h1>Site instellingen</h1>
        <p class="muted">Brand, contact, kleuren en mailconfiguratie.</p>
      </div>
    </header>

    <p v-if="status || savingKey" class="status">{{ savingKey ? 'Autosave...' : status }}</p>
    <p v-if="savedAt" class="muted small">Laatst automatisch opgeslagen om {{ savedAt }}.</p>
    <p v-if="error" class="error">Autosave fout: {{ error }}</p>

    <div v-if="form" class="forms">
      <section class="card">
        <h2>Brand</h2>
        <div class="grid grid-2">
          <div>
            <label class="label">Brand naam</label>
            <input v-model="form.brandName" class="input" @input="queueForm" />
          </div>
          <div>
            <label class="label">Tagline</label>
            <input v-model="form.tagline" class="input" @input="queueForm" />
          </div>
        </div>
        <div class="grid grid-2 mt">
          <div>
            <label class="label">Logo</label>
            <ImageUpload v-model="form.logoUrl" @update:modelValue="queueForm" />
          </div>
          <div>
            <label class="label">Logo formaat</label>
            <div class="size-grid">
              <div>
                <span class="hint">Breedte px</span>
                <input v-model.number="form.logoWidth" type="number" min="0" max="600" class="input" @input="queueForm" />
              </div>
              <div>
                <span class="hint">Hoogte px</span>
                <input v-model.number="form.logoHeight" type="number" min="16" max="160" class="input" @input="queueForm" />
              </div>
            </div>
            <p class="muted small">Laat breedte op 0 voor automatische verhouding. Standaard hoogte is 34px.</p>
          </div>
        </div>
        <div class="mt">
          <label class="label">Footer tekst</label>
          <textarea v-model="form.footerText" class="textarea" @input="queueForm"></textarea>
        </div>
      </section>

      <section class="card">
        <h2>Contact</h2>
        <div class="grid grid-2">
          <div><label class="label">E-mail</label><input v-model="form.contactEmail" class="input" @input="queueForm" /></div>
          <div><label class="label">Telefoon</label><input v-model="form.phone" class="input" @input="queueForm" /></div>
        </div>
        <div class="mt"><label class="label">Adres</label><input v-model="form.address" class="input" @input="queueForm" /></div>
      </section>

      <section class="card">
        <h2>Social links</h2>
        <p class="muted small section-note">Alleen ingevulde social links worden in de footer getoond.</p>
        <div class="grid grid-3 mt">
          <div><label class="label">Instagram URL</label><input v-model="form.socialInstagram" class="input" @input="queueForm" /></div>
          <div><label class="label">LinkedIn URL</label><input v-model="form.socialLinkedin" class="input" @input="queueForm" /></div>
          <div><label class="label">GitHub URL</label><input v-model="form.socialGithub" class="input" @input="queueForm" /></div>
        </div>
      </section>

      <section class="card">
        <h2>Mail (SMTP)</h2>
        <div class="grid grid-2">
          <div><label class="label">Host</label><input v-model="form.mailHost" class="input" @input="queueForm" /></div>
          <div><label class="label">Port</label><input v-model="form.mailPort" class="input" @input="queueForm" /></div>
          <div><label class="label">User</label><input v-model="form.mailUser" class="input" @input="queueForm" /></div>
          <div><label class="label">Wachtwoord</label><input v-model="form.mailPassword" type="password" class="input" @input="queueForm" /></div>
          <div><label class="label">Afzender (from)</label><input v-model="form.mailFrom" class="input" @input="queueForm" /></div>
        </div>
        <div class="mail-options mt">
          <label class="check">
            <input v-model="form.mailSecure" type="checkbox" @change="queueForm" />
            SSL/direct secure
          </label>
          <label class="check">
            <input v-model="form.mailStarttls" type="checkbox" @change="queueForm" />
            STARTTLS/TLS
          </label>
          <label class="check">
            <input v-model="form.mailRejectUnauthorized" type="checkbox" @change="queueForm" />
            Certificaat controleren
          </label>
        </div>
        <p class="muted small section-note">
          Voor poort 587: SSL uit, STARTTLS aan. Als je server een certificaat voor een andere hostnaam gebruikt, zet certificaatcontrole uit of gebruik de hostnaam die op het certificaat staat.
        </p>
      </section>
    </div>
  </div>
</template>

<script setup>
import { nextTick, ref, onMounted, watch } from 'vue'
import { useAdminStore } from '../../stores/admin'
import { useSiteStore } from '../../stores/site'
import ImageUpload from '../../components/admin/ImageUpload.vue'
import { useAutosave } from '../../composables/autosave'

const admin = useAdminStore()
const site = useSiteStore()
const form = ref(null)
const status = ref('')
const { savingKey, savedAt, error, queue } = useAutosave((settings) => admin.saveSettings(settings))

onMounted(async () => {
  await admin.load()
  form.value = normalizeSettings(admin.settings)
  previewTheme()
})

watch(() => admin.settings, (s) => {
  if (s && !form.value) {
    form.value = normalizeSettings(s)
    previewTheme()
  }
})

function normalizeSettings(settings) {
  return {
    ...settings,
    mailSecure: Boolean(settings?.mailSecure),
    mailStarttls: settings?.mailStarttls !== false,
    mailRejectUnauthorized: settings?.mailRejectUnauthorized !== false,
  }
}

function queueForm() {
  if (!form.value) return
  previewTheme()
  nextTick(() => {
    queue('settings', { ...form.value })
    status.value = 'Wijzigingen worden automatisch opgeslagen...'
  })
}

function previewTheme() {
  if (!form.value) return
  site.settings = { ...(site.settings || {}), ...form.value }
  site.applyTheme()
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin-bottom: 24px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.status { padding: 10px 16px; border-radius: 10px; background: var(--info-bg); color: var(--accent-2);
  border: 1px solid var(--info-border); margin-bottom: 16px; font-size: 0.9rem; }
.error { color: var(--danger); }
.forms { display: flex; flex-direction: column; gap: 22px; }
.card h2 { font-size: 1.1rem; margin-bottom: 18px; }
.section-note { margin-top: -8px; margin-bottom: 0; }
.mt { margin-top: 16px; }
.mail-options { display: flex; flex-wrap: wrap; gap: 14px; }
.check { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 0.9rem; font-weight: 700; }
.size-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hint { display: block; margin-bottom: 6px; color: var(--muted); font-size: 0.78rem; font-weight: 700; }

@media (max-width: 700px) {
  .size-grid { grid-template-columns: 1fr; }
}
</style>
