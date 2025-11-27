import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Auth views
import LoginView from '@/views/auth/LoginView.vue'
import RegisterView from '@/views/auth/RegisterView.vue'

// Volunteer views (simple)
import VolunteerActivitiesView from '@/views/volunteer/ActivitiesView.vue'
import VolunteerMapView from '@/views/volunteer/MapView.vue'
import ActivityDetailView from '@/views/volunteer/ActivityDetailView.vue'

// Admin/Coordinator views (modular)
import DashboardView from '@/views/admin/DashboardView.vue'
import ActivitiesManagementView from '@/views/admin/ActivitiesManagementView.vue'
import CreateActivityView from '@/views/admin/CreateActivityView.vue'
import EditActivityView from '@/views/admin/EditActivityView.vue'
import UsersManagementView from '@/views/admin/UsersManagementView.vue'
import InvitationsView from '@/views/admin/InvitationsView.vue'
import MapManagementView from '@/views/admin/MapManagementView.vue'

const routes = [
  // Auth routes
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { requiresAuth: false, guestOnly: true }
  },
  {
    path: '/register/:token',
    name: 'register',
    component: RegisterView,
    meta: { requiresAuth: false, guestOnly: true }
  },

  // Volunteer routes (simple interface)
  {
    path: '/',
    name: 'home',
    redirect: to => {
      const authStore = useAuthStore()
      if (authStore.isVolunteer) {
        return { name: 'volunteer-activities' }
      }
      return { name: 'dashboard' }
    },
    meta: { requiresAuth: true }
  },
  {
    path: '/actividades',
    name: 'volunteer-activities',
    component: VolunteerActivitiesView,
    meta: { requiresAuth: true, roles: ['voluntario', 'coordinador', 'administrador'] }
  },
  {
    path: '/actividades/:id',
    name: 'activity-detail',
    component: ActivityDetailView,
    meta: { requiresAuth: true, roles: ['voluntario', 'coordinador', 'administrador'] }
  },
  {
    path: '/mapa',
    name: 'volunteer-map',
    component: VolunteerMapView,
    meta: { requiresAuth: true, roles: ['voluntario', 'coordinador', 'administrador'] }
  },

  // Admin/Coordinator routes (modular interface)
  {
    path: '/admin',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true, roles: ['coordinador', 'administrador'] }
  },
  {
    path: '/admin/actividades',
    name: 'activities-management',
    component: ActivitiesManagementView,
    meta: { requiresAuth: true, roles: ['coordinador', 'administrador'] }
  },
  {
    path: '/admin/actividades/crear',
    name: 'create-activity',
    component: CreateActivityView,
    meta: { requiresAuth: true, roles: ['coordinador', 'administrador'] }
  },
  {
    path: '/admin/actividades/:id/editar',
    name: 'edit-activity',
    component: EditActivityView,
    meta: { requiresAuth: true, roles: ['coordinador', 'administrador'] }
  },
  {
    path: '/admin/mapa',
    name: 'map-management',
    component: MapManagementView,
    meta: { requiresAuth: true, roles: ['coordinador', 'administrador'] }
  },
  {
    path: '/admin/usuarios',
    name: 'users-management',
    component: UsersManagementView,
    meta: { requiresAuth: true, roles: ['administrador'] }
  },
  {
    path: '/admin/invitaciones',
    name: 'invitations',
    component: InvitationsView,
    meta: { requiresAuth: true, roles: ['administrador'] }
  },

  // Catch-all
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  // Check if route is guest only
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'home' })
  }

  // Check role permissions
  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role)) {
    // Redirect based on role
    if (authStore.isVolunteer) {
      return next({ name: 'volunteer-activities' })
    }
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
