<template>
  <div class="admin" :class="{ 'menu-open': mobileNavOpen }">
    <header class="mobile-bar">
      <router-link to="/" class="m-brand" @click="mobileNavOpen = false">
        <span class="brand-mark">TD/</span>
        <span class="m-brand-name">Admin</span>
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
          <router-link to="/admin/messages" active-class="active">Berichten</router-link>
          <router-link to="/admin/chat" active-class="active">Chat</router-link>
          <router-link to="/admin/mail-templates" active-class="active">Mail templates</router-link>
        </div>
      </nav>

      <div class="bottom">
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
        <router-link to="/admin/messages" class="bell" aria-label="Berichten">
          <span>Berichten</span>
          <span v-if="admin.messagesUnread" class="count">{{ admin.messagesUnread }}</span>
        </router-link>
      </header>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <div class="toasts" aria-live="polite">
      <button
        v-for="toast in admin.toasts"
        :key="toast.id"
        class="toast"
        type="button"
        @click="admin.dismissToast(toast.id)"
      >
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

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.mobile-bar { display: none; }
.backdrop { display: none; }

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
</style>
