<template>
  <div>
    <header class="head">
      <div>
        <h1>Mijn account</h1>
        <p class="muted">Wijzig je e-mailadres of wachtwoord.</p>
      </div>
    </header>

    <section class="card">
      <form @submit.prevent="save" novalidate>
        <h2>E-mailadres</h2>
        <label class="label mt" for="email">E-mail</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="input"
          autocomplete="email"
          :class="{ 'has-error': errors.email }"
        />
        <p v-if="errors.email" class="field-error">{{ errors.email }}</p>

        <h2 class="section-title">Wachtwoord wijzigen</h2>
        <p class="muted small">Laat leeg als je het wachtwoord niet wilt wijzigen.</p>

        <label class="label mt" for="current-pw">Huidig wachtwoord</label>
        <input
          id="current-pw"
          v-model="form.currentPassword"
          type="password"
          class="input"
          autocomplete="current-password"
          :class="{ 'has-error': errors.currentPassword }"
        />
        <p v-if="errors.currentPassword" class="field-error">{{ errors.currentPassword }}</p>

        <label class="label mt" for="new-pw">Nieuw wachtwoord</label>
        <input
          id="new-pw"
          v-model="form.newPassword"
          type="password"
          class="input"
          autocomplete="new-password"
          placeholder="Min. 8 tekens"
          :class="{ 'has-error': errors.newPassword }"
        />
        <p v-if="errors.newPassword" class="field-error">{{ errors.newPassword }}</p>

        <label class="label mt" for="confirm-pw">Bevestig nieuw wachtwoord</label>
        <input
          id="confirm-pw"
          v-model="form.confirmPassword"
          type="password"
          class="input"
          autocomplete="new-password"
          :class="{ 'has-error': errors.confirmPassword }"
        />
        <p v-if="errors.confirmPassword" class="field-error">{{ errors.confirmPassword }}</p>

        <p v-if="serverError" class="error">{{ serverError }}</p>
        <p v-if="savedMsg" class="success">{{ savedMsg }}</p>

        <div class="actions">
          <button type="submit" class="btn btn-primary" :disabled="saving">
            {{ saving ? 'Opslaan...' : 'Opslaan' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { api } from '../../composables/api'

const auth = useAuthStore()

const form = ref({
  email: auth.user?.email || '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const errors = ref({})
const serverError = ref('')
const savedMsg = ref('')
const saving = ref(false)

function validate() {
  const e = {}
  if (!form.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email.trim())) {
    e.email = 'Geldig e-mailadres is verplicht.'
  }
  if (form.value.newPassword) {
    if (!form.value.currentPassword) e.currentPassword = 'Verplicht bij wachtwoordwijziging.'
    if (form.value.newPassword.length < 8) e.newPassword = 'Minimaal 8 tekens.'
    if (form.value.newPassword !== form.value.confirmPassword) e.confirmPassword = 'Wachtwoorden komen niet overeen.'
  }
  errors.value = e
  return Object.keys(e).length === 0
}

async function save() {
  serverError.value = ''
  savedMsg.value = ''
  if (!validate()) return
  saving.value = true
  try {
    const r = await api.put('/api/admin/account', {
      email: form.value.email.trim(),
      currentPassword: form.value.currentPassword,
      newPassword: form.value.newPassword,
    })
    const updated = { ...auth.user, email: r.email }
    auth.user = updated
    localStorage.setItem('td_user', JSON.stringify(updated))
    form.value.currentPassword = ''
    form.value.newPassword = ''
    form.value.confirmPassword = ''
    savedMsg.value = 'Wijzigingen opgeslagen.'
    window.setTimeout(() => { savedMsg.value = '' }, 3000)
  } catch (e) {
    serverError.value = e.message
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.head { margin-bottom: 24px; }
.head h1 { font-size: 1.8rem; margin-bottom: 4px; }
.card { max-width: 560px; padding: 28px; }
.card:hover { transform: none; }
h2 { font-size: 1.05rem; margin: 0 0 4px; }
.section-title { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border); }
.mt { margin-top: 14px; }
.actions { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
.has-error { border-color: var(--danger); }
.field-error { color: var(--danger); font-size: 0.82rem; margin: 5px 0 0; }
.error { color: var(--danger); margin-top: 14px; }
.success { color: var(--success); margin-top: 14px; }
</style>
