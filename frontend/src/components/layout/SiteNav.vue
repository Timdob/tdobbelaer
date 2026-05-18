<template>
  <header class="nav">
    <div class="container nav-inner">
      <router-link to="/" class="brand" @click="menuOpen = false">
        <span class="brand-code">TD/</span>
        <span class="brand-name">TD Development</span>
      </router-link>

      <nav class="links" :class="{ open: menuOpen }">
        <router-link
          v-for="item in visibleMenuItems"
          :key="item.to"
          :to="item.to"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </router-link>

        <template v-if="auth.isAuth">
          <router-link v-if="auth.isAdmin" to="/admin" @click="menuOpen = false">Admin</router-link>
          <router-link v-if="auth.isClient" to="/portaal" @click="menuOpen = false">Portaal</router-link>
          <button class="btn-link" @click="logout">Uitloggen</button>
        </template>
      </nav>

      <div class="right">
        <router-link to="/contact" class="btn btn-primary nav-cta">Plan een gesprek</router-link>
        <button class="burger" :class="{ open: menuOpen }" @click="menuOpen = !menuOpen" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>

  <nav
    class="mobile-bottom"
    :class="{ 'has-chat': site.settings?.chatEnabled, 'has-login': !auth.isAuth }"
    aria-label="Mobiele navigatie"
  >
    <router-link to="/" class="bottom-item" :class="{ active: route.path === '/' }">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10.8 12 4l8 6.8V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.2Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      <span>Home</span>
    </router-link>
    <router-link to="/contact" class="bottom-item" :class="{ active: route.path === '/contact' }">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-11Z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m6.5 7.5 5.5 4 5.5-4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Contact</span>
    </router-link>
    <button
      v-if="site.settings?.chatEnabled"
      class="bottom-item chat-action"
      type="button"
      @click="openChat"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v5A3.5 3.5 0 0 1 15.5 15H12l-4.2 3.4A.8.8 0 0 1 6.5 17.8V15A3.5 3.5 0 0 1 3 11.5v-5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>
      <span>Chat</span>
    </button>
    <router-link v-if="!auth.isAuth" to="/login" class="bottom-item" :class="{ active: route.path === '/login' }">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-2M3 12h11M10 8l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span>Login</span>
    </router-link>
    <button class="bottom-item" type="button" @click="menuOpen = !menuOpen">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/></svg>
      <span>Menu</span>
    </button>
  </nav>

  <button
    v-if="menuOpen"
    class="mobile-menu-backdrop"
    type="button"
    aria-label="Menu sluiten"
    @click="menuOpen = false"
  ></button>

  <nav v-if="menuOpen" class="mobile-menu-sheet" aria-label="Mobiel menu">
    <router-link
      v-for="item in visibleMenuItems"
      :key="item.to"
      :to="item.to"
      @click="menuOpen = false"
    >
      {{ item.label }}
    </router-link>

    <router-link v-if="auth.isAdmin" to="/admin" @click="menuOpen = false">Admin</router-link>
    <router-link v-if="auth.isClient" to="/portaal" @click="menuOpen = false">Portaal</router-link>
    <button v-if="auth.isAuth" class="btn-link" type="button" @click="logout">Uitloggen</button>
  </nav>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useSiteStore } from '../../stores/site'

const auth = useAuthStore()
const site = useSiteStore()
const router = useRouter()
const route = useRoute()
const menuOpen = ref(false)

const cmsMenuItems = computed(() => {
  return site.navPages.map((page) => ({
    label: page.title,
    to: page.slug === 'home' ? '/' : `/${page.slug}`,
  }))
})

const fallbackItems = [
  { label: 'Home', to: '/' },
  { label: 'Contact', to: '/contact' },
]

const visibleMenuItems = computed(() => {
  const loginItem = auth.isAuth ? [] : [{ label: 'Login', to: '/login' }]
  const items = [...fallbackItems, ...cmsMenuItems.value, ...loginItem]
  const seen = new Set()
  return items.filter((item) => {
    if (seen.has(item.to)) return false
    seen.add(item.to)
    return true
  })
})

function logout() {
  auth.logout()
  menuOpen.value = false
  router.push('/')
}

function openChat() {
  menuOpen.value = false
  window.dispatchEvent(new CustomEvent('td:open-chat'))
}
</script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 50;
  padding: 0;
  background:
    linear-gradient(90deg, color-mix(in srgb, var(--accent) 5%, transparent), transparent 34%, color-mix(in srgb, var(--accent-2) 5%, transparent)),
    color-mix(in srgb, var(--surface) 90%, transparent);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(18px) saturate(120%);
}
.nav::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 28%, transparent), color-mix(in srgb, var(--accent-2) 22%, transparent), transparent);
  opacity: 0.7;
}
.nav-inner {
  min-height: 78px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  font-weight: 800;
  white-space: nowrap;
  padding: 0;
  transition: background 0.2s, transform 0.2s;
}
.brand:hover {
  transform: translateY(-1px);
}
.brand-code {
  display: grid;
  place-items: center;
  width: auto;
  height: auto;
  border: 0;
  border-radius: 0;
  background: none;
  color: var(--accent);
  font-family: var(--font-display);
  font-size: 1.9rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  text-shadow: none;
}
.brand-name {
  color: var(--text);
  font-family: var(--font-display);
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.links {
  display: flex;
  align-items: center;
  gap: 28px;
  margin-left: auto;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
}
.links a,
.btn-link {
  position: relative;
  color: color-mix(in srgb, var(--text) 76%, transparent);
  font-weight: 600;
  font-size: 0.91rem;
  background: transparent;
  border: 0;
  padding: 28px 0 26px;
  border-radius: 0;
  cursor: pointer;
  transition: color 0.2s;
}
.links a:hover,
.links a.router-link-active,
.btn-link:hover {
  color: var(--text);
  background: transparent;
  box-shadow: none;
}
.links a::after,
.btn-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 18px;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, var(--accent), var(--accent-2));
  opacity: 0;
  transform: scaleX(0.35);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.links a:hover::after,
.links a.router-link-active::after,
.btn-link:hover::after {
  opacity: 1;
  transform: scaleX(1);
}
.right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.nav-cta {
  min-height: 42px;
  padding: 10px 19px;
  border-radius: 8px;
  font-size: 0.84rem;
  background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, #0b3b36));
  box-shadow:
    0 12px 28px color-mix(in srgb, var(--accent) 18%, transparent),
    inset 0 1px 0 color-mix(in srgb, var(--text-inverse) 20%, transparent);
}
.burger {
  display: none;
  width: 40px;
  height: 40px;
  border: 1px solid var(--border);
  background: var(--surface);
  border-radius: 8px;
  flex-direction: column;
  gap: 5px;
  justify-content: center;
  padding: 0;
}
.burger span {
  display: block;
  width: 20px;
  height: 2px;
  background: var(--accent);
  margin: 0 auto;
}
.mobile-bottom {
  display: none;
}
.mobile-menu-backdrop,
.mobile-menu-sheet {
  display: none;
}
@media (max-width: 980px) {
  .burger { display: flex; }
  .links {
    position: fixed;
    top: 84px;
    right: 16px;
    left: 16px;
    padding: 18px;
    background: color-mix(in srgb, var(--surface) 96%, var(--bg));
    border: 1px solid var(--border);
    border-radius: 8px;
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-6px);
    transition: all 0.15s;
    box-shadow: var(--shadow);
  }
  .links a,
  .btn-link {
    padding: 10px 12px;
  }
  .links.open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .links a::after,
  .btn-link::after { display: none; }
}
@media (max-width: 620px) {
  .brand-name { display: none; }
  .nav-cta { display: none; }
  .burger { display: none; }
  :global(body) {
    padding-bottom: 82px;
  }
  .nav {
    top: 0;
  }
  .nav-inner {
    min-height: 66px;
  }
  .links {
    display: none;
  }
  .mobile-bottom {
    position: fixed;
    left: 8px;
    right: 8px;
    bottom: 8px;
    z-index: 60;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
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
  .mobile-bottom.has-chat.has-login {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .mobile-bottom.has-chat:not(.has-login) {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .mobile-bottom:not(.has-chat):not(.has-login) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .bottom-item {
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
    overflow: hidden;
  }
  .bottom-item + .bottom-item::before {
    content: "";
    position: absolute;
    left: -1px;
    top: 10px;
    bottom: 10px;
    width: 1px;
    background: color-mix(in srgb, var(--text) 9%, transparent);
  }
  .bottom-item svg {
    width: 19px;
    height: 19px;
    flex: 0 0 auto;
  }
  .bottom-item span {
    display: block;
    width: 100%;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .bottom-item.active,
  .bottom-item:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    border-color: color-mix(in srgb, var(--accent) 24%, transparent);
    color: var(--accent);
  }
  .chat-action {
    color: var(--text-inverse);
    background: linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 80%, #0b3b36));
    border-color: var(--accent);
    box-shadow:
      0 10px 22px color-mix(in srgb, var(--accent) 18%, transparent),
      inset 0 1px 0 color-mix(in srgb, var(--text-inverse) 20%, transparent);
  }
  .chat-action svg {
    width: 20px;
    height: 20px;
  }
  .chat-action span {
    color: var(--text-inverse);
  }
  .mobile-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: 58;
    display: block;
    border: 0;
    background: color-mix(in srgb, var(--text) 18%, transparent);
  }
  .mobile-menu-sheet {
    position: fixed;
    right: 12px;
    bottom: 82px;
    left: 12px;
    z-index: 61;
    display: flex;
    max-height: min(420px, calc(100vh - 162px));
    padding: 14px;
    overflow-y: auto;
    flex-direction: column;
    gap: 8px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: color-mix(in srgb, var(--surface) 98%, var(--bg));
    box-shadow: var(--shadow);
    backdrop-filter: blur(18px) saturate(130%);
  }
  .mobile-menu-sheet a,
  .mobile-menu-sheet .btn-link {
    width: 100%;
    min-height: 44px;
    display: flex;
    align-items: center;
    padding: 10px 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--field-bg);
    color: var(--text);
    font-weight: 800;
    text-align: left;
  }
  .mobile-menu-sheet a.router-link-active {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-dim);
  }
}
</style>
