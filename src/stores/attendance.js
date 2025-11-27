import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAttendanceStore = defineStore('attendance', () => {
  // State
  const attendances = ref({}) // { activityId: [attendances] }
  const userAttendances = ref({}) // { activityId: attendance }
  const loading = ref(false)
  const error = ref(null)

  const attendanceStatuses = ref([
    { value: 'asistira', label: 'Asistiré', color: 'success', icon: '✓' },
    { value: 'no_asistira', label: 'No asistiré', color: 'error', icon: '✗' },
    { value: 'quizas_asistira', label: 'Quizás asista', color: 'warning', icon: '?' }
  ])

  // Actions
  async function fetchActivityAttendances(activityId) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/activities/${activityId}/attendance`)
      attendances.value[activityId] = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al cargar asistencias'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function getActivityAttendance(activityId) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.get(`/activities/${activityId}/attendance`)
      attendances.value[activityId] = response.data
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al cargar asistencias'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function registerAttendance(data) {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.post(`/activities/${data.activity_id}/attendance`, { 
        status: data.status 
      })
      userAttendances.value[data.activity_id] = response.data
      
      // Update attendances list if loaded
      if (attendances.value[data.activity_id]) {
        const index = attendances.value[data.activity_id].findIndex(
          a => a.user_id === response.data.user_id
        )
        if (index !== -1) {
          attendances.value[data.activity_id][index] = response.data
        } else {
          attendances.value[data.activity_id].push(response.data)
        }
      }
      
      return response.data
    } catch (err) {
      error.value = err.response?.data?.detail || 'Error al registrar asistencia'
      throw err
    } finally {
      loading.value = false
    }
  }

  function getAttendanceStatusLabel(status) {
    return attendanceStatuses.value.find(s => s.value === status)?.label || status
  }

  function getAttendancesByActivity(activityId) {
    return attendances.value[activityId] || []
  }

  function getUserAttendance(activityId) {
    return userAttendances.value[activityId]
  }

  function getAttendanceCount(activityId, status = null) {
    const list = attendances.value[activityId] || []
    if (status) {
      return list.filter(a => a.status === status).length
    }
    return list.length
  }

  return {
    // State
    attendances,
    userAttendances,
    loading,
    error,
    attendanceStatuses,
    // Actions
    getActivityAttendance,
    fetchActivityAttendances,
    registerAttendance,
    getAttendanceStatusLabel,
    getAttendancesByActivity,
    getUserAttendance,
    getAttendanceCount
  }
})
