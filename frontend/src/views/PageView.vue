<template>
  <article class="page-view">
    <div v-if="loading" class="container loader">Laden...</div>
    <div v-else-if="error" class="container error">
      <h1>404</h1><p class="muted">{{ error }}</p>
      <router-link to="/" class="btn btn-ghost">Terug naar home</router-link>
    </div>
    <template v-else-if="page">
      <header class="page-hero">
        <div v-if="page.heroImage" class="page-hero-image" :style="{ backgroundImage: `url(${page.heroImage})` }"></div>
        <div class="container page-hero-inner">
          <span class="eyebrow">Pagina</span>
          <h1>{{ page.title }}</h1>
          <p v-if="page.excerpt" class="lead">{{ page.excerpt }}</p>
        </div>
      </header>
      <div class="container page-body">
        <div v-if="hasSections" class="sections">
          <section
            v-for="section in page.sections"
            :key="section.id"
            class="content-section"
            :class="`section-${section.type || 'text'}`"
          >
            <div v-if="section.type === 'imageText'" class="image-text">
              <img v-if="section.imageUrl" :src="section.imageUrl" :alt="section.title || ''" />
              <div>
                <span v-if="section.kicker" class="eyebrow">{{ section.kicker }}</span>
                <h2 v-if="section.title">{{ section.title }}</h2>
                <div class="prose" v-html="section.body"></div>
                <router-link v-if="section.ctaLabel && section.ctaUrl" :to="section.ctaUrl" class="btn btn-primary">
                  {{ section.ctaLabel }}
                </router-link>
              </div>
            </div>

            <div v-else-if="section.type === 'cards'" class="cards-section">
              <span v-if="section.kicker" class="eyebrow">{{ section.kicker }}</span>
              <h2 v-if="section.title">{{ section.title }}</h2>
              <p v-if="section.body" class="muted">{{ section.body }}</p>
              <div class="card-grid">
                <article v-for="card in section.items || []" :key="card.id" class="mini-card">
                  <h3>{{ card.title }}</h3>
                  <p>{{ card.text }}</p>
                </article>
              </div>
            </div>

            <div v-else-if="section.type === 'cta'" class="cta-section">
              <span v-if="section.kicker" class="eyebrow">{{ section.kicker }}</span>
              <h2 v-if="section.title">{{ section.title }}</h2>
              <div v-if="section.body" class="prose" v-html="section.body"></div>
              <router-link v-if="section.ctaLabel && section.ctaUrl" :to="section.ctaUrl" class="btn btn-primary">
                {{ section.ctaLabel }}
              </router-link>
            </div>

            <div v-else>
              <span v-if="section.kicker" class="eyebrow">{{ section.kicker }}</span>
              <h2 v-if="section.title">{{ section.title }}</h2>
              <div class="prose" v-html="section.body"></div>
            </div>
          </section>
          <div v-if="page.body" class="prose" v-html="page.body"></div>
        </div>
        <div v-else class="prose" v-html="page.body"></div>
      </div>
    </template>
  </article>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api } from '../composables/api'
import { useSiteStore } from '../stores/site'

const route = useRoute()
const site = useSiteStore()
const page = ref(null)
const loading = ref(false)
const error = ref('')
const hasSections = computed(() => Array.isArray(page.value?.sections) && page.value.sections.length > 0)

async function load() {
  loading.value = true; error.value = ''; page.value = null
  try {
    if (route.name === 'page-preview') {
      page.value = await api.get(`/api/admin/page-preview/${encodeURIComponent(route.params.id)}`)
      return
    }
    const slug = route.params.slug
    if (!site.loaded) await site.load()
    const localPage = site.pageBySlug(slug)
    page.value = localPage || await api.get(`/api/page/${encodeURIComponent(slug)}`)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function setMeta(name, content, attribute = 'name') {
  if (!content) return
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function applySeo() {
  if (!page.value) return
  document.title = page.value.seoTitle || page.value.title || 'TD Development'
  setMeta('description', page.value.seoDescription || page.value.excerpt || '')
  setMeta('robots', page.value.noIndex ? 'noindex,nofollow' : 'index,follow')
  setMeta('og:title', page.value.seoTitle || page.value.title || '', 'property')
  setMeta('og:description', page.value.seoDescription || page.value.excerpt || '', 'property')
  setMeta('og:image', page.value.ogImage || page.value.heroImage || '', 'property')
}

watch(() => [route.name, route.params.slug, route.params.id], () => load(), { immediate: true })
watch(page, applySeo)
</script>

<style scoped>
.page-view { min-height: 60vh; }
.loader, .error { padding: 120px 0; text-align: center; }
.error h1 { font-size: 5rem; }
.page-hero { position: relative; padding: 100px 0 60px; overflow: hidden; }
.page-hero-image {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  opacity: 0.25; mask-image: linear-gradient(180deg, black 30%, transparent);
}
.page-hero-inner { position: relative; max-width: 800px; }
.page-body { max-width: 760px; padding-bottom: 100px; }
.sections { display: grid; gap: 28px; }
.content-section {
  padding: 28px;
  border: 1px solid var(--border);
  border-radius: 22px;
  background: color-mix(in srgb, var(--surface) 62%, transparent);
  box-shadow: inset 0 1px 0 color-mix(in srgb, var(--text) 5%, transparent);
}
.image-text {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
  gap: 28px;
  align-items: center;
}
.image-text img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 18px;
  border: 1px solid var(--border);
}
.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 18px; }
.mini-card {
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--field-bg);
}
.mini-card h3 { margin: 0 0 8px; }
.mini-card p { margin: 0; color: var(--muted); line-height: 1.6; }
.cta-section { text-align: center; }
.prose :deep(h2) { margin-top: 1.6em; }
.prose :deep(h3) { margin-top: 1.4em; }
.prose :deep(p) { color: var(--text); opacity: 0.85; line-height: 1.75; }
.prose :deep(a) { color: var(--accent-2); border-bottom: 1px solid currentColor; }
.prose :deep(img) { border-radius: var(--radius); margin: 24px 0; border: 1px solid var(--border); }
.prose :deep(ul), .prose :deep(ol) { padding-left: 22px; line-height: 1.8; }
.prose :deep(blockquote) { border-left: 3px solid var(--accent); padding-left: 18px; margin: 24px 0; color: var(--muted); font-style: italic; }
@media (max-width: 820px) {
  .image-text,
  .card-grid { grid-template-columns: 1fr; }
}
</style>
