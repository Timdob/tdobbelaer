<template>
  <section class="login">
    <div class="container login-wrap">
      <div v-if="!token" class="login-card surface">
        <span class="eyebrow">Fout</span>
        <h1>Ongeldige link</h1>
        <p class="muted">De resetlink is ongeldig. Vraag een nieuwe aan.</p>
        <router-link to="/wachtwoord-vergeten" class="btn btn-primary" style="justify-content:center;margin-top:8px">Nieuwe link aanvragen</router-link>
      </div>

      <form v-else-if="!done" class="login-card surface" @submit.prevent="submit">
        <span class="eyebrow">Nieuw wachtwoord</span>
        <h1>Wachtwoord instellen</h1>
        <p class="muted">Kies een nieuw wachtwoord van minimaal 8 tekens.</p>

        <label class="label" style="margin-top:8px">Nieuw wachtwoord</label>
        <input v-model="password" type="password" class="input" required autocomplete="new-password" minlength="8" />

        <label class="label" style="margin-top:14px">Herhaal wachtwoord</label>
        <input v-model="confirm" type="password" class="input" required autocomplete="new-password" minlength="8" />

        <p v-if="error" class="error">{{ error }}</p>

        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Bezig...' : 'Wachtwoord opslaan' }}
        </button>
      </form>

      <div v-else class="login-card surface success-card">
        <span class="eyebrow">Gelukt</span>
        <h1>Wachtwoord gewijzigd</h1>
        <p class="muted">Je wachtwoord is succesvol opgeslagen. Je kunt nu inloggen.</p>
        <router-link to="/login" class="btn btn-primary" style="justify-content:center;margin-top:8px">Inloggen</router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const token = route.query.token || ''
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)
const done = ref(false)

async function submit() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = 'Wachtwoorden komen niet overeen.'
    return
  }
  loading.value = true
  try {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: password.value }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Er is iets misgegaan.')
    done.value = true
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login { padding: 120px 0; }
.login-wrap { max-width: 420px; }
.login-card { padding: 40px; display: flex; flex-direction: column; gap: 6px; }
.login-card h1 { margin-top: 12px; font-size: 2rem; }
.login-card .btn { margin-top: 22px; }
.error { color: var(--danger); font-size: 0.9rem; margin: 10px 0 0; }
.success-card { gap: 12px; }
.success-card p { line-height: 1.6; }
</style>
