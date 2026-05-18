<template>
  <section class="login">
    <div class="container login-wrap">
      <form class="login-card surface" @submit.prevent="submit">
        <span class="eyebrow">Welkom terug</span>
        <h1>Inloggen</h1>
        <p class="muted">Log in als admin of klant.</p>

        <label class="label">E-mail</label>
        <input v-model="email" type="email" class="input" required autocomplete="email" />

        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:14px">
          <label class="label" style="margin:0">Wachtwoord</label>
          <router-link to="/wachtwoord-vergeten" class="forgot-link">Wachtwoord vergeten?</router-link>
        </div>
        <input v-model="password" type="password" class="input" required autocomplete="current-password" />

        <p v-if="error" class="error">{{ error }}</p>

        <button class="btn btn-primary" type="submit" :disabled="loading">
          {{ loading ? 'Bezig...' : 'Inloggen' }}
        </button>

        <div class="hint muted small">
          Demo: admin@td-development.nl / demo1234<br/>
          Klant: klant@demo.nl / demo1234
        </div>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

async function submit() {
  loading.value = true; error.value = ''
  try {
    const res = await auth.login(email.value, password.value)
    const redirect = route.query.redirect || (res.user.role === 'admin' ? '/admin' : '/portaal')
    router.push(redirect)
  } catch (e) { error.value = e.message }
  finally { loading.value = false }
}
</script>

<style scoped>
.login { padding: 120px 0; }
.login-wrap { max-width: 420px; }
.login-card { padding: 40px; display: flex; flex-direction: column; gap: 6px; }
.login-card h1 { margin-top: 12px; font-size: 2rem; }
.login-card .btn { margin-top: 22px; justify-content: center; }
.error { color: var(--danger); font-size: 0.9rem; margin: 10px 0 0; }
.hint { margin-top: 22px; padding-top: 22px; border-top: 1px solid var(--border); }
.forgot-link { font-size: 0.82rem; color: var(--muted); text-decoration: underline; text-underline-offset: 3px; }
.forgot-link:hover { color: var(--accent); }
</style>
