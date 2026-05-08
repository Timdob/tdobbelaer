<template>
  <div class="app-shell">
    <MeshBackground />
    <template v-if="!isAdminRoute">
      <SiteNav />
      <main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
      <SiteFooter />
      <ChatWidget />
    </template>
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import MeshBackground from './components/layout/MeshBackground.vue'
import SiteNav from './components/layout/SiteNav.vue'
import SiteFooter from './components/layout/SiteFooter.vue'
import ChatWidget from './components/public/ChatWidget.vue'
import { useSiteStore } from './stores/site'

const site = useSiteStore()
const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))

onMounted(async () => {
  await site.load()
  site.listenToUpdates()
})
</script>

<style>
.app-shell { min-height: 100vh; display: flex; flex-direction: column; }
.main { flex: 1; }

.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
