import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'administrador')
  const isCoordinator = computed(() => user.value?.role === 'coordinador')
  const isVolunteer = computed(() => user.value?.role === 'voluntario')
  const canManage = computed(() => isAdmin.value || isCoordinator.value)
  const userRole = computed(() => user.value?.role || null)

  // Actions
  async function login(email, password) {
    loading.value = true
    error.value = null
    
    try {
      // Use form data for OAuth2 compatibility
      const formData = new URLSearchParams()
      formData.append('username', email)
      formData.append('password', password)
      
      const response = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      })
      token.value = response.data.access_token
      localStorage.setItem('token', token.value)
      
      // Fetch user info
      await fetchUser()
      
      // Redirect based on role
      if (isVolunteer.value) {
        router.push({ name: 'volunteer-activities' })
      } else {
        router.push({ name: 'dashboard' })
      }
      
      return true
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al iniciar sesión'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(data) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/auth/register', data)
      token.value = response.data.access_token
      localStorage.setItem('token', token.value)
      
      await fetchUser()
      
      if (isVolunteer.value) {
        router.push({ name: 'volunteer-activities' })
      } else {
        router.push({ name: 'dashboard' })
      }
      
      return true
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al registrarse'
      return false
    } finally {
      loading.value = false
    }
  }

  async function fetchUser() {
    if (!token.value) return
    
    try {
      const response = await api.get('/users/me')
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (err) {
      // Only logout if token is invalid (401/403), not on network errors
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout()
      }
      throw err
    }
  }

  async function checkAuth() {
    if (!token.value) return false
    
    try {
      await fetchUser()
      return true
    } catch (err) {
      // Token invalid, clear auth
      logout()
      return false
    }
  }

  async function initializeAuth() {
    if (token.value && user.value) {
      // We have both token and user, try to refresh user data
      try {
        await fetchUser()
      } catch (err) {
        // If refresh fails, keep the cached user data
        console.warn('Failed to refresh user data:', err)
      }
      return true
    } else if (token.value) {
      // We have token but no user, fetch user
      return await checkAuth()
    }
    return false
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push({ name: 'login' })
  }

  async function validateInvitation(invitationToken) {
    try {
      const response = await api.get(`/auth/invitation/${invitationToken}`)
      return response.data
    } catch (err) {
      throw new Error(err.response?.data?.detail || 'Invitación inválida')
    }
  }

  return {
    // State
    user,
    token,
    loading,
    error,
    // Getters
    isAuthenticated,
    isAdmin,
    isCoordinator,
    isVolunteer,
    canManage,
    userRole,
    // Actions
    login,
    register,
    logout,
    fetchUser,
    checkAuth,
    initializeAuth,
    validateInvitation
  }
})
