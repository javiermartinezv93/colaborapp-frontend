<script setup>
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'

const authStore = useAuthStore()
const router = useRouter()

const isAuthenticated = computed(() => authStore.isAuthenticated)
const isAuthRoute = computed(() => {
  const authRoutes = ['login', 'register']
  return authRoutes.includes(router.currentRoute.value.name)
})

onMounted(() => {
  authStore.checkAuth()
})
</script>

<template>
  <component :is="isAuthenticated && !isAuthRoute ? AppLayout : AuthLayout">
    <router-view />
  </component>
</template>
