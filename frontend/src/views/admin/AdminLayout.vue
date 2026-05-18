<template>
  <div class="admin" :class="{ 'menu-open': mobileNavOpen }">
    <header class="mobile-bar">
      <router-link to="/" class="m-brand" @click="mobileNavOpen = false">
        <span class="brand-mark">TD/</span>
        <span class="m-brand-name">Admin</span>
      </router-link>
      <router-link to="/admin/chat" class="m-bell" :class="{ 'bell-alert': admin.chatUnread }" aria-label="Chat" @click="mobileNavOpen = false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H12l-4.2 3.4A.8.8 0 0 1 6.5 17.8V15A3.5 3.5 0 0 1 3 11.5v-5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
        <span v-if="admin.chatUnread" class="m-count">{{ admin.chatUnread }}</span>
      </router-link>
      <router-link to="/admin/messages" class="m-bell" aria-label="Berichten" @click="mobileNavOpen = false">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0v4l1.5 3h-15L6 13z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M10 19a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>
        <span v-if="admin.messagesUnread" class="m-count">{{ admin.messagesUnread }}</span>
      </router-link>
      <button
        class="burger"
        :class="{ open: mobileNavOpen }"
        type="button"
        @click="mobileNavOpen = !mobileNavOpen"
        :aria-expanded="mobileNavOpen"
        aria-label="Menu"
      >
        <span></span><span></span><span></span>
      </button>
    </header>

    <div
      v-if="mobileNavOpen"
      class="backdrop"
      @click="mobileNavOpen = false"
      aria-hidden="true"
    ></div>

    <aside class="sidebar" :class="{ open: mobileNavOpen }">
      <router-link to="/" class="brand" @click="mobileNavOpen = false">
        <span class="brand-mark">TD/</span>
        <div>
          <div class="brand-name">TD Development</div>
          <div class="muted small">Admin panel</div>
        </div>
      </router-link>

      <nav class="snav" @click="onNavClick">
        <router-link to="/admin" exact-active-class="active">Dashboard</router-link>

        <div class="nav-group">
          <span>Website beheer</span>
          <router-link to="/admin/pages" active-class="active">Pagina's</router-link>
          <router-link to="/admin/menu" active-class="active">Menu</router-link>
        </div>

        <div class="nav-group">
          <span>Homepage</span>
          <router-link to="/admin/hero" active-class="active">Homepage hero</router-link>
          <router-link to="/admin/packages" active-class="active">Pakketten</router-link>
          <router-link to="/admin/blocks" active-class="active">Homepage blokken</router-link>
          <router-link to="/admin/quote" active-class="active">Offerte builder</router-link>
        </div>

        <div class="nav-group">
          <span>Bedrijf</span>
          <router-link to="/admin/settings" active-class="active">Site instellingen</router-link>
          <router-link to="/admin/customers" active-class="active">Klanten</router-link>
          <router-link to="/admin/invoices" active-class="active">Facturen</router-link>
          <router-link to="/admin/service-addons" active-class="active">Extra diensten</router-link>
          <router-link to="/admin/messages" active-class="active">Berichten</router-link>
          <router-link to="/admin/chat" active-class="active" class="nav-chat-link">
            Chat
            <span v-if="admin.chatUnread" class="nav-badge">{{ admin.chatUnread }}</span>
          </router-link>
          <router-link to="/admin/mail-templates" active-class="active">Mail templates</router-link>
        </div>
      </nav>

      <div class="bottom">
        <div v-if="auth.lastLogin" class="last-login">
          <span class="last-login-label">Laatste login</span>
          <span class="last-login-val">{{ formatDate(auth.lastLogin) }}</span>
        </div>
        <router-link to="/admin/account" class="btn btn-ghost" @click="mobileNavOpen = false">Mijn account</router-link>
        <router-link to="/" class="btn btn-ghost" @click="mobileNavOpen = false">Bekijk site</router-link>
        <button class="btn btn-ghost" @click="logout">Uitloggen</button>
      </div>
    </aside>

    <main class="content">
      <header class="topbar">
        <div>
          <span class="muted small">Ingelogd als</span>
          <strong>{{ auth.user?.email }}</strong>
        </div>
        <div class="topbar-actions">
          <router-link to="/admin/chat" class="bell" :class="{ 'bell-alert': admin.chatUnread }" aria-label="Chat">
            <svg viewBox="0 0 24 24" aria-hidden="true" width="17" height="17"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H12l-4.2 3.4A.8.8 0 0 1 6.5 17.8V15A3.5 3.5 0 0 1 3 11.5v-5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
            <span>Chat</span>
            <span v-if="admin.chatUnread" class="count">{{ admin.chatUnread }}</span>
          </router-link>
          <router-link to="/admin/messages" class="bell" aria-label="Berichten">
            <span>Berichten</span>
            <span v-if="admin.messagesUnread" class="count">{{ admin.messagesUnread }}</span>
          </router-link>
        </div>
      </header>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <nav class="admin-bottom-bar" aria-label="Admin mobiele navigatie">
      <router-link to="/admin" exact-active-class="admin-bottom-active" class="admin-bottom-item">
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>
        <span>Dashboard</span>
      </router-link>
      <router-link to="/admin/customers" active-class="admin-bottom-active" class="admin-bottom-item">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span>Klanten</span>
      </router-link>
      <router-link to="/admin/chat" active-class="admin-bottom-active" class="admin-bottom-item" :class="{ 'bottom-alert': admin.chatUnread }">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H12l-4.2 3.4A.8.8 0 0 1 6.5 17.8V15A3.5 3.5 0 0 1 3 11.5v-5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
        <span>Chat</span>
        <span v-if="admin.chatUnread" class="bottom-badge">{{ admin.chatUnread }}</span>
      </router-link>
      <router-link to="/admin/settings" active-class="admin-bottom-active" class="admin-bottom-item">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        <span>Instellingen</span>
      </router-link>
      <button class="admin-bottom-item" type="button" @click="mobileNavOpen = !mobileNavOpen">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
        <span>Menu</span>
      </button>
    </nav>

    <div class="toasts" aria-live="polite">
      <button
        v-for="toast in admin.toasts"
        :key="toast.id"
        class="toast"
        :class="toast.type"
        type="button"
        @click="admin.dismissToast(toast.id)"
      >
        <span v-if="toast.type === 'chat'" class="toast-icon">
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H12l-4.2 3.4A.8.8 0 0 1 6.5 17.8V15A3.5 3.5 0 0 1 3 11.5v-5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
        </span>
        {{ toast.message }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { disconnectSocket } from '../../composables/socket'
import { useAdminStore } from '../../stores/admin'
import { useAuthStore } from '../../stores/auth'
import { useSiteStore } from '../../stores/site'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const admin = useAdminStore()
useSiteStore()

const mobileNavOpen = ref(false)

watch(() => route.fullPath, () => {
  mobileNavOpen.value = false
})

function onNavClick(event) {
  if (event.target.closest('a')) {
    mobileNavOpen.value = false
  }
}

onMounted(async () => {
  await admin.loadAll()
  admin.startRealtime()
})

onBeforeUnmount(() => {
  admin.stopRealtime()
})

function logout() {
  admin.stopRealtime()
  auth.logout()
  disconnectSocket()
  router.push('/login')
}

</script>

<style scoped>
.admin {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--accent) 10%, transparent), transparent 28%),
    radial-gradient(circle at 82% 12%, color-mix(in srgb, var(--accent-2) 7%, transparent), transparent 30%);
}
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 24px 18px;
  background: color-mix(in srgb, var(--bg) 72%, transparent);
  border-right: 1px solid var(--border);
  backdrop-filter: blur(22px) saturate(130%);
  display: flex;
  flex-direction: column;
  gap: 26px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 54%, transparent);
}
.brand-mark {
  width: 44px;
  height: 42px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent) 34%, transparent), transparent 55%), var(--bg);
  border: 1px solid color-mix(in srgb, var(--accent) 48%, transparent);
  color: var(--accent);
  font-family: var(--font-display);
  font-weight: 900;
  box-shadow: var(--glow);
}
.brand-name { font-family: var(--font-display); font-weight: 800; }

.snav { display: flex; flex-direction: column; gap: 18px; flex: 1; overflow-y: auto; padding-right: 4px; }
.nav-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.nav-group > span {
  padding: 0 10px 4px;
  color: var(--accent-2);
  font-size: 0.68rem;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.snav a {
  padding: 11px 13px;
  border-radius: 13px;
  color: var(--muted);
  font-weight: 650;
  font-size: 0.92rem;
  transition: all 0.15s;
  border: 1px solid transparent;
}
.snav a:hover { background: var(--surface-hover); color: var(--text); }
.snav a.active {
  background: linear-gradient(135deg, var(--accent-dim), color-mix(in srgb, var(--accent-2) 9%, transparent));
  color: var(--text);
  border-color: var(--border-strong);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text) 6%, transparent);
}

.bottom { display: flex; flex-direction: column; gap: 8px; }
.bottom .btn { justify-content: center; font-size: 0.85rem; }

.content { padding: 28px 44px 44px; max-width: 100%; overflow-x: hidden; }
.topbar {
  min-height: 56px;
  margin-bottom: 28px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: color-mix(in srgb, var(--surface) 42%, transparent);
}
.topbar > div { display: flex; flex-direction: column; gap: 2px; }
.bell {
  position: relative; display: inline-flex; align-items: center; gap: 10px;
  min-height: 40px; padding: 0 14px; border: 1px solid var(--border);
  border-radius: var(--radius); color: var(--text); background: var(--surface);
}
.bell:hover { border-color: var(--accent-2); color: var(--accent-2); }
.count {
  min-width: 22px; height: 22px; padding: 0 7px; display: inline-grid; place-items: center;
  border-radius: 999px; background: var(--accent); color: var(--text-inverse); font-size: 0.75rem; font-weight: 700;
}
.toasts {
  position: fixed; right: 22px; bottom: 22px; z-index: 20;
  display: flex; flex-direction: column; gap: 10px; width: min(340px, calc(100vw - 44px));
}
.toast {
  text-align: left; padding: 13px 15px; border-radius: var(--radius);
  border: 1px solid var(--info-border);
  background: var(--surface-a);
  color: var(--text); box-shadow: var(--shadow); cursor: pointer;
}
.toast.chat {
  display: flex; align-items: center; gap: 9px;
  border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  background: color-mix(in srgb, var(--accent) 7%, var(--surface));
}
.toast-icon { flex: 0 0 auto; color: var(--accent); display: flex; }

.topbar-actions { display: flex; align-items: center; gap: 8px; }
.nav-chat-link { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.nav-badge {
  min-width: 20px; height: 20px; padding: 0 6px; display: inline-grid; place-items: center;
  border-radius: 999px; background: var(--accent); color: var(--text-inverse);
  font-size: 0.7rem; font-weight: 700; font-style: normal;
}
.bell-alert {
  border-color: color-mix(in srgb, var(--accent) 50%, transparent);
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
  color: var(--accent);
}
.bell-alert:hover { border-color: var(--accent); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.mobile-bar { display: none; }
.backdrop { display: none; }

.last-login {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 13px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: color-mix(in srgb, var(--surface) 50%, transparent);
}
.last-login-label {
  font-size: 0.67rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent-2);
}
.last-login-val {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--muted);
}

.admin-bottom-bar { display: none; }

@media (max-width: 900px) {
  .admin {
    display: block;
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .mobile-bar {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: color-mix(in srgb, var(--bg) 86%, transparent);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(18px) saturate(120%);
  }
  .m-brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-right: auto;
    color: var(--text);
  }
  .m-brand .brand-mark {
    width: 36px;
    height: 36px;
    box-shadow: none;
  }
  .m-brand-name {
    font-family: var(--font-display);
    font-weight: 800;
    font-size: 0.95rem;
    letter-spacing: -0.01em;
  }
  .m-bell {
    position: relative;
    display: inline-grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
  }
  .m-bell svg { width: 20px; height: 20px; }
  .m-count {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    display: inline-grid;
    place-items: center;
    border-radius: 999px;
    background: var(--accent);
    color: var(--text-inverse);
    font-size: 0.66rem;
    font-weight: 700;
  }
  .burger {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
  }
  .burger span {
    display: block;
    width: 20px;
    height: 2px;
    margin: 0 auto;
    background: var(--accent);
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
  .burger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .burger.open span:nth-child(2) { opacity: 0; }
  .burger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(300px, 86vw);
    height: 100vh;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: 22px 0 60px color-mix(in srgb, var(--text) 22%, transparent);
  }
  .sidebar.open { transform: translateX(0); }

  .backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 35;
    background: color-mix(in srgb, var(--text) 42%, transparent);
    backdrop-filter: blur(2px);
  }

  .content { padding: 22px 16px 36px; }
  .topbar {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 20px;
    padding: 12px 14px;
  }
  .topbar > div { gap: 0; }
  .topbar > .bell { display: none; }
}

@media (max-width: 620px) {
  .mobile-bar { display: none; }
  .content { padding: 16px 14px 100px; }

  .admin-bottom-bar {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: 8px;
    z-index: 50;
    gap: 0;
    padding: 6px;
    border: 1px solid var(--border);
    border-radius: 14px;
    background:
      linear-gradient(180deg, color-mix(in srgb, var(--surface) 98%, transparent), color-mix(in srgb, var(--surface) 90%, var(--bg))),
      var(--surface);
    box-shadow:
      0 18px 44px color-mix(in srgb, var(--text) 18%, transparent),
      inset 0 1px 0 color-mix(in srgb, var(--text-inverse) 34%, transparent);
    backdrop-filter: blur(20px) saturate(140%);
  }
  .admin-bottom-item {
    position: relative;
    min-width: 0;
    min-height: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border: 1px solid transparent;
    border-radius: 10px;
    background: transparent;
    color: var(--muted);
    font-size: 0.61rem;
    font-weight: 800;
    line-height: 1;
    overflow: visible;
  }
  .admin-bottom-item + .admin-bottom-item::before {
    content: "";
    position: absolute;
    left: -1px;
    top: 10px;
    bottom: 10px;
    width: 1px;
    background: color-mix(in srgb, var(--text) 9%, transparent);
  }
  .admin-bottom-item svg { width: 19px; height: 19px; flex: 0 0 auto; }
  .admin-bottom-item span { display: block; width: 100%; overflow: hidden; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
  .admin-bottom-item.admin-bottom-active,
  .admin-bottom-item:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    border-color: color-mix(in srgb, var(--accent) 24%, transparent);
    color: var(--accent);
  }
  .bottom-alert {
    color: var(--accent);
  }
  .bottom-badge {
    position: absolute;
    top: 4px;
    right: 8px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    display: inline-grid;
    place-items: center;
    border-radius: 999px;
    background: var(--accent);
    color: var(--text-inverse);
    font-size: 0.62rem;
    font-weight: 700;
    width: auto !important;
  }
}
</style>
