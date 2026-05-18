<template>
  <section class="login">
    <div class="container login-wrap">
      <form v-if="!sent" class="login-card surface" @submit.prevent="submit">
        <span class="eyebrow">Toegang herstellen</span>
        <h1>Wachtwoord vergeten</h1>
        <p class="muted">Vul je e-mailadres in. Als er een account bestaat, ontvang je een resetlink.</p>

        <label class="label" style="margin-top:8px">E-mail</label>
        <input v-model="email" type="email" class="input" required autocomplete="email" />

        <p v-if="error" class="error">{{ error }}</p>

        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Bezig...' : 'Stuur resetlink' }}
        </button>

        <router-link to="/login" class="back-link">← Terug naar inloggen</router-link>
      </form>

      <div v-else class="login-card surface success-card">
        <span class="eyebrow">Verstuurd</span>
        <h1>Controleer je mail</h1>
        <p class="muted">Als er een account bestaat voor <strong>{{ email }}</strong>, ontvang je binnen enkele minuten een e-mail met een resetlink.</p>
        <router-link to="/login" class="btn btn-primary" style="justify-content:center;margin-top:8px">Terug naar inloggen</router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const error = ref('')
const loading = ref(false)
const sent = ref(false)

async function submit() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || 'Er is iets misgegaan.')
    sent.value = true
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
.back-link { margin-top: 16px; font-size: 0.85rem; color: var(--muted); text-align: center; text-decoration: underline; text-underline-offset: 3px; }
.back-link:hover { color: var(--accent); }
.success-card { gap: 12px; }
.success-card p { line-height: 1.6; }
</style>
