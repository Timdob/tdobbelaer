<template>
  <section class="contact section">
    <div class="container contact-grid">
      <div>
        <span class="eyebrow">Contact</span>
        <h1>{{ page?.title || 'Vertel kort wat je wilt bouwen.' }}</h1>
        <p class="lead">{{ page?.excerpt || 'Je bericht komt direct in het adminpanel terecht. Als SMTP is ingesteld, wordt er ook een mail gestuurd.' }}</p>
        <div v-if="page?.body" class="body" v-html="page.body"></div>

        <div class="contact-details">
          <a v-if="settings.contactEmail" :href="`mailto:${settings.contactEmail}`">{{ settings.contactEmail }}</a>
          <a v-if="settings.phone" :href="`tel:${settings.phone}`">{{ settings.phone }}</a>
          <span v-if="settings.address">{{ settings.address }}</span>
        </div>
      </div>

      <form class="card contact-form" @submit.prevent="submit">
        <div class="grid grid-2">
          <div>
            <label class="label">Naam</label>
            <input v-model="form.name" class="input" required autocomplete="name" />
          </div>
          <div>
            <label class="label">E-mail</label>
            <input v-model="form.email" type="email" class="input" required autocomplete="email" />
          </div>
        </div>
        <div class="grid grid-2">
          <div>
            <label class="label">Telefoon</label>
            <input v-model="form.phone" class="input" autocomplete="tel" />
          </div>
          <div>
            <label class="label">Bedrijf</label>
            <input v-model="form.company" class="input" autocomplete="organization" />
          </div>
        </div>
        <div>
          <label class="label">Onderwerp</label>
          <input v-model="form.subject" class="input" />
        </div>
        <div>
          <label class="label">Bericht</label>
          <textarea v-model="form.message" class="textarea" rows="7" required></textarea>
        </div>

        <p v-if="status" class="status" :class="{ error: failed }">{{ status }}</p>
        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Versturen...' : 'Bericht versturen' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { api } from '../composables/api'
import { useSiteStore } from '../stores/site'

const site = useSiteStore()
const settings = computed(() => site.settings || {})
const page = computed(() => site.pageBySlug('contact'))
const form = reactive({
  name: '',
  email: '',
  phone: '',
  company: '',
  subject: 'Website aanvraag',
  message: '',
})
const loading = ref(false)
const status = ref('')
const failed = ref(false)

async function submit() {
  loading.value = true
  status.value = ''
  failed.value = false
  try {
    await api.post('/api/contact', form)
    status.value = 'Bedankt. Je bericht is verzonden.'
    Object.assign(form, { name: '', email: '', phone: '', company: '', subject: 'Website aanvraag', message: '' })
  } catch (e) {
    failed.value = true
    status.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.contact-grid {
  display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 60px; align-items: start;
}
h1 { margin-top: 14px; }
.contact-details {
  display: flex; flex-direction: column; gap: 10px;
  margin-top: 28px; color: var(--muted);
}
.body {
  margin-top: 20px;
  max-width: 640px;
}
.body :deep(p) { color: var(--muted); line-height: 1.75; }
.body :deep(a) { color: var(--accent); border-bottom: 1px solid currentColor; }
.contact-details a:hover { color: var(--accent-2); }
.contact-form { display: flex; flex-direction: column; gap: 16px; }
.contact-form .btn { justify-content: center; }
.status {
  margin: 0; padding: 10px 12px; border-radius: 10px;
  border: 1px solid var(--info-border);
  background: var(--info-bg); color: var(--accent-2);
}
.status.error {
  border-color: var(--danger-border);
  background: var(--danger-bg); color: var(--danger);
}
@media (max-width: 900px) {
  .contact-grid { grid-template-columns: 1fr; }
}
</style>
