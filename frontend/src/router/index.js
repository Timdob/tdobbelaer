import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/login', name: 'login', component: () => import('../views/LoginView.vue') },
  { path: '/contact', name: 'contact', component: () => import('../views/ContactView.vue') },
  { path: '/offerte', name: 'quote', component: () => import('../views/QuoteView.vue') },
  { path: '/socket-test', name: 'socket-test', component: () => import('../views/SocketTestView.vue') },
  { path: '/preview/:id', name: 'page-preview', meta: { requiresAdmin: true },
    component: () => import('../views/PageView.vue') },
  { path: '/portaal', name: 'portal', meta: { requiresClient: true },
    component: () => import('../views/PortalView.vue') },
  {
    path: '/admin',
    component: () => import('../views/admin/AdminLayout.vue'),
    meta: { requiresAdmin: true },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('../views/admin/AdminDashboard.vue') },
      { path: 'settings', name: 'admin-settings', component: () => import('../views/admin/AdminSettings.vue') },
      { path: 'pages', name: 'admin-pages', component: () => import('../views/admin/AdminPages.vue') },
      { path: 'menu', name: 'admin-menu', component: () => import('../views/admin/AdminMenu.vue') },
      { path: 'hero', name: 'admin-hero', component: () => import('../views/admin/AdminHero.vue') },
      { path: 'packages', name: 'admin-packages', component: () => import('../views/admin/AdminPackages.vue') },
      { path: 'blocks', name: 'admin-blocks', component: () => import('../views/admin/AdminBlocks.vue') },
      { path: 'quote', name: 'admin-quote', component: () => import('../views/admin/AdminQuote.vue') },
      { path: 'customers', name: 'admin-customers', component: () => import('../views/admin/AdminCustomers.vue') },
      { path: 'messages', name: 'admin-messages', component: () => import('../views/admin/AdminMessages.vue') },
      { path: 'chat', name: 'admin-chat', component: () => import('../views/admin/AdminChat.vue') },
      { path: 'mail-templates', name: 'admin-mail-templates', component: () => import('../views/admin/AdminMailTemplates.vue') },
    ],
  },
  { path: '/:slug', name: 'page', component: () => import('../views/PageView.vue'), props: true },
]

const router = createRouter({ history: createWebHistory(), routes,
  scrollBehavior(_to, _from, saved) { return saved || { top: 0 } } })

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAdmin && !auth.isAdmin) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.requiresClient && !auth.isClient) return { name: 'login', query: { redirect: to.fullPath } }
  return true
})

export default router
