import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './styles/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

const auth = useAuthStore()
if (auth.token) {
  auth.fetchMe().catch(() => {})
}

app.mount('#app')
