import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/services/api'

export const useUsersStore = defineStore('users', () => {
  // State
  const users = ref([])
  const invitations = ref([])
  const loading = ref(false)
  const error = ref(null)

  const roles = ref([
    { value: 'voluntario', label: 'Voluntario', color: 'info' },
    { value: 'coordinador', label: 'Coordinador', color: 'warning' },
    { value: 'administrador', label: 'Administrador', color: 'error' }
  ])

  // Actions
  async function fetchUsers(skip = 0, limit = 100) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/users', { params: { skip, limit } })
      users.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al cargar usuarios'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchInvitations(skip = 0, limit = 100) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/users/invitations', { params: { skip, limit } })
      invitations.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al cargar invitaciones'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createInvitation(email, roleAssigned) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/users/invite', {
        email,
        role_assigned: roleAssigned
      })
      invitations.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al crear invitación'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateUser(id, payload) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put(`/users/${id}`, payload)
      // Update local cache
      const idx = users.value.findIndex(u => u.id === id)
      if (idx !== -1) users.value[idx] = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al actualizar usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteUser(id) {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/users/${id}`)
      users.value = users.value.filter(u => u.id !== id)
      return true
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al eliminar usuario'
      throw err
    } finally {
      loading.value = false
    }
  }

  function getRoleLabel(role) {
    return roles.value.find(r => r.value === role)?.label || role
  }

  function getRoleColor(role) {
    return roles.value.find(r => r.value === role)?.color || 'neutral'
  }

  return {
    // State
    users,
    invitations,
    loading,
    error,
    roles,
    // Actions
    fetchUsers,
    fetchInvitations,
    createInvitation,
    updateUser,
    deleteUser,
    getRoleLabel,
    getRoleColor
  }
})
