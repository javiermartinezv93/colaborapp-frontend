<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  CalendarIcon,
  MapIcon,
  UsersIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const sidebarOpen = ref(false)

const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)
const isCoordinator = computed(() => authStore.isCoordinator)
const isVolunteer = computed(() => authStore.isVolunteer)
const canManage = computed(() => authStore.canManage)

// Navigation items based on role
const volunteerNav = [
  { name: 'Actividades', href: '/actividades', icon: CalendarIcon, route: 'volunteer-activities' },
  { name: 'Mapa', href: '/mapa', icon: MapIcon, route: 'volunteer-map' }
]

const adminNav = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon, route: 'dashboard' },
  { name: 'Actividades', href: '/admin/actividades', icon: CalendarIcon, route: 'activities-management' },
  { name: 'Mapa', href: '/admin/mapa', icon: MapIcon, route: 'map-management' }
]

const adminOnlyNav = [
  { name: 'Usuarios', href: '/admin/usuarios', icon: UsersIcon, route: 'users-management' },
  { name: 'Invitaciones', href: '/admin/invitaciones', icon: EnvelopeIcon, route: 'invitations' }
]

const navigation = computed(() => {
  if (isVolunteer.value) {
    return volunteerNav
  }
  let nav = [...adminNav]
  if (isAdmin.value) {
    nav = [...nav, ...adminOnlyNav]
  }
  return nav
})

function isActive(routeName) {
  return route.name === routeName
}

function handleLogout() {
  authStore.logout()
}

function getRoleBadge(role) {
  const badges = {
    'administrador': 'badge-error',
    'coordinador': 'badge-warning',
    'voluntario': 'badge-info'
  }
  return badges[role] || 'badge-neutral'
}

function getRoleLabel(role) {
  const labels = {
    'administrador': 'Admin',
    'coordinador': 'Coordinador',
    'voluntario': 'Voluntario'
  }
  return labels[role] || role
}
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <!-- Mobile sidebar backdrop -->
    <div 
      v-if="sidebarOpen" 
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
      @click="sidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside 
      :class="[
        'fixed top-0 left-0 z-50 h-full w-64 bg-base-100 shadow-xl transition-transform duration-300 lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between h-16 px-4 border-b border-base-300">
        <router-link to="/" class="flex items-center gap-2">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <CalendarIcon class="w-5 h-5 text-primary-content" />
          </div>
          <span class="font-bold text-lg">Actividades</span>
        </router-link>
        <button 
          class="btn btn-ghost btn-sm lg:hidden"
          @click="sidebarOpen = false"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-1">
        <router-link
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            isActive(item.route) 
              ? 'bg-primary text-primary-content' 
              : 'hover:bg-base-200 text-base-content'
          ]"
          @click="sidebarOpen = false"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span>{{ item.name }}</span>
        </router-link>
      </nav>

      <!-- User info at bottom -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-base-300 bg-base-100">
        <div class="flex items-center gap-3 mb-3">
          <div class="avatar placeholder">
            <div class="w-10 rounded-full bg-neutral text-neutral-content">
              <UserCircleIcon class="w-6 h-6" />
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">{{ user?.username }}</p>
            <span :class="['badge badge-sm', getRoleBadge(user?.role)]">
              {{ getRoleLabel(user?.role) }}
            </span>
          </div>
        </div>
        <div class="space-y-2">
          <router-link 
            to="/perfil"
            class="btn btn-ghost btn-block btn-sm gap-2"
            @click="sidebarOpen = false"
          >
            <UserCircleIcon class="w-4 h-4" />
            Mi Perfil
          </router-link>
          <button 
            class="btn btn-ghost btn-block btn-sm gap-2"
            @click="handleLogout"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <div class="lg:pl-64">
      <!-- Top navbar -->
      <header class="sticky top-0 z-30 bg-base-100 shadow-sm">
        <div class="flex items-center justify-between h-16 px-4">
          <button 
            class="btn btn-ghost btn-sm lg:hidden"
            @click="sidebarOpen = true"
          >
            <Bars3Icon class="w-5 h-5" />
          </button>
          
          <div class="flex-1 lg:hidden"></div>
          
          <!-- Breadcrumb or page title -->
          <div class="hidden lg:flex items-center gap-2 text-sm">
            <span class="text-base-content/60">{{ new Date().toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</span>
          </div>
          
          <!-- Quick actions -->
          <div class="flex items-center gap-2">
            <!-- View activities link for admins -->
            <router-link 
              v-if="canManage"
              to="/actividades"
              class="btn btn-ghost btn-sm gap-1"
            >
              <CalendarIcon class="w-4 h-4" />
              <span class="hidden sm:inline">Vista Simple</span>
            </router-link>
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="p-4 lg:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
