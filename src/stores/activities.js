import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useActivitiesStore = defineStore('activities', () => {
  // State
  const activities = ref([])
  const currentActivity = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const filters = ref({
    status: null,
    type: null,
    search: ''
  })

  // Activity types and statuses for UI
  const activityTypes = ref([
    { value: 'casa_a_casa', label: 'Casa a Casa', color: 'primary' },
    { value: 'volanteo', label: 'Volanteo', color: 'secondary' }
  ])

  const activityStatuses = ref([
    { value: 'programada', label: 'Programada', color: 'info' },
    { value: 'finalizada', label: 'Finalizada', color: 'success' }
  ])

  // Getters
  const filteredActivities = computed(() => {
    let result = [...activities.value]
    
    // Always exclude cancelled activities from all views
    result = result.filter(a => a.status !== 'cancelada')

    if (filters.value.status) {
      result = result.filter(a => a.status === filters.value.status)
    }

    if (filters.value.type) {
      result = result.filter(a => a.type === filters.value.type)
    }

    if (filters.value.search) {
      const search = filters.value.search.toLowerCase()
      result = result.filter(a => 
        a.title.toLowerCase().includes(search) ||
        a.description?.toLowerCase().includes(search)
      )
    }

    return result
  })

  const programmedActivities = computed(() => 
    activities.value.filter(a => a.status === 'programada')
  )

  const finishedActivities = computed(() => 
    activities.value.filter(a => a.status === 'finalizada')
  )

  const cancelledActivities = computed(() => 
    activities.value.filter(a => a.status === 'cancelada')
  )

  // Actions
  async function fetchActivities() {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get('/activities')
      activities.value = response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al cargar actividades'
    } finally {
      loading.value = false
    }
  }

  async function fetchActivity(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/activities/${id}`)
      currentActivity.value = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al cargar actividad'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createActivity(data) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post('/activities', data)
      activities.value.unshift(response.data)
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al crear actividad'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateActivity(id, data) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.put(`/activities/${id}`, data)
      const index = activities.value.findIndex(a => a.id === id)
      if (index !== -1) {
        activities.value[index] = response.data
      }
      if (currentActivity.value?.id === id) {
        currentActivity.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al actualizar actividad'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelActivity(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post(`/activities/${id}/cancel`)
      const index = activities.value.findIndex(a => a.id === id)
      if (index !== -1) {
        activities.value[index] = response.data
      }
      if (currentActivity.value?.id === id) {
        currentActivity.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al cancelar actividad'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function finishActivity(id) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post(`/activities/${id}/finish`)
      const index = activities.value.findIndex(a => a.id === id)
      if (index !== -1) {
        activities.value[index] = response.data
      }
      if (currentActivity.value?.id === id) {
        currentActivity.value = response.data
      }
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al finalizar actividad'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setFilter(key, value) {
    filters.value[key] = value
  }

  function clearFilters() {
    filters.value = {
      status: null,
      type: null,
      search: ''
    }
  }

  function getActivityTypeLabel(type) {
    return activityTypes.value.find(t => t.value === type)?.label || type
  }

  function getActivityStatusLabel(status) {
    return activityStatuses.value.find(s => s.value === status)?.label || status
  }

  return {
    // State
    activities,
    currentActivity,
    loading,
    error,
    filters,
    activityTypes,
    activityStatuses,
    // Getters
    filteredActivities,
    programmedActivities,
    finishedActivities,
    cancelledActivities,
    // Actions
    fetchActivities,
    fetchActivity,
    createActivity,
    updateActivity,
    cancelActivity,
    finishActivity,
    setFilter,
    clearFilters,
    getActivityTypeLabel,
    getActivityStatusLabel
  }
})
