<script setup>
import { ref, computed } from 'vue'
import { useActivitiesStore } from '@/stores/activities'
import { useAttendanceStore } from '@/stores/attendance'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  activity: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])

const activitiesStore = useActivitiesStore()
const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

const loading = ref(false)
const selectedStatus = ref(null)
const attendees = ref([])
const loadingAttendees = ref(false)

const statusOptions = [
  { value: 'asistira', label: 'Asistiré', icon: '✓', class: 'btn-success' },
  { value: 'quizas_asistira', label: 'Quizás', icon: '?', class: 'btn-warning' },
  { value: 'no_asistira', label: 'No asistiré', icon: '✗', class: 'btn-error' }
]

const currentUserAttendance = computed(() => {
  return attendees.value.find(a => a.user_id === authStore.user?.id)
})

const isAdmin = computed(() => authStore.isAdmin || authStore.isCoordinador)

// Load attendees on mount
loadAttendees()

async function loadAttendees() {
  loadingAttendees.value = true
  try {
    const data = await attendanceStore.getActivityAttendance(props.activity.id)
    attendees.value = data
    
    // Set current user's attendance status if exists
    const userAttendance = currentUserAttendance.value
    if (userAttendance) {
      selectedStatus.value = userAttendance.status
    }
  } catch (error) {
    console.error('Error loading attendees:', error)
  } finally {
    loadingAttendees.value = false
  }
}

async function registerAttendance(status) {
  loading.value = true
  try {
    await attendanceStore.registerAttendance({
      activity_id: props.activity.id,
      status
    })
    selectedStatus.value = status
    await loadAttendees()
    emit('updated')
  } catch (error) {
    console.error('Error registering attendance:', error)
  } finally {
    loading.value = false
  }
}

function close() {
  emit('close')
}

function getStatusBadgeClass(status) {
  const classes = {
    'asistira': 'badge-success',
    'quizas_asistira': 'badge-warning',
    'no_asistira': 'badge-error'
  }
  return classes[status] || 'badge-ghost'
}

function getStatusLabel(status) {
  const labels = {
    'asistira': 'Asistirá',
    'quizas_asistira': 'Quizás',
    'no_asistira': 'No asistirá'
  }
  return labels[status] || status
}

const groupedAttendees = computed(() => {
  return {
    asistira: attendees.value.filter(a => a.status === 'asistira'),
    quizas_asistira: attendees.value.filter(a => a.status === 'quizas_asistira'),
    no_asistira: attendees.value.filter(a => a.status === 'no_asistira')
  }
})
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-lg">
      <button 
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="close"
      >
        ✕
      </button>

      <h3 class="font-bold text-lg mb-4">Confirmar Asistencia</h3>
      <p class="text-gray-600 mb-4">{{ activity.title }}</p>

      <!-- Attendance buttons -->
      <div v-if="activity.status === 'programada'" class="mb-6">
        <p class="text-sm text-gray-500 mb-3">¿Podrás asistir a esta actividad?</p>
        <div class="flex gap-2 flex-wrap">
          <button
            v-for="option in statusOptions"
            :key="option.value"
            :class="[
              'btn btn-sm',
              selectedStatus === option.value ? option.class : 'btn-outline'
            ]"
            :disabled="loading"
            @click="registerAttendance(option.value)"
          >
            <span>{{ option.icon }}</span>
            {{ option.label }}
          </button>
        </div>
        <p v-if="currentUserAttendance" class="text-xs text-gray-500 mt-2">
          Tu respuesta actual: 
          <span :class="['badge badge-sm', getStatusBadgeClass(currentUserAttendance.status)]">
            {{ getStatusLabel(currentUserAttendance.status) }}
          </span>
        </p>
      </div>

      <div v-else class="alert alert-info mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Esta actividad está {{ activity.status === 'finalizada' ? 'finalizada' : 'cancelada' }}</span>
      </div>

      <!-- Attendees list (visible to admins/coordinators) -->
      <div v-if="isAdmin">
        <div class="divider">Participantes</div>
        
        <div v-if="loadingAttendees" class="flex justify-center py-4">
          <span class="loading loading-spinner loading-md"></span>
        </div>

        <div v-else-if="attendees.length === 0" class="text-center text-gray-500 py-4">
          Aún no hay respuestas registradas
        </div>

        <div v-else class="space-y-4">
          <!-- Confirmed -->
          <div v-if="groupedAttendees.asistira.length > 0">
            <h4 class="font-semibold text-sm text-success flex items-center gap-1 mb-2">
              <span>✓</span> Asistirán ({{ groupedAttendees.asistira.length }})
            </h4>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="attendee in groupedAttendees.asistira" 
                :key="attendee.id"
                class="badge badge-success gap-1"
              >
                {{ attendee.user?.name || 'Usuario' }}
              </div>
            </div>
          </div>

          <!-- Maybe -->
          <div v-if="groupedAttendees.quizas_asistira.length > 0">
            <h4 class="font-semibold text-sm text-warning flex items-center gap-1 mb-2">
              <span>?</span> Quizás ({{ groupedAttendees.quizas_asistira.length }})
            </h4>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="attendee in groupedAttendees.quizas_asistira" 
                :key="attendee.id"
                class="badge badge-warning gap-1"
              >
                {{ attendee.user?.name || 'Usuario' }}
              </div>
            </div>
          </div>

          <!-- Won't attend -->
          <div v-if="groupedAttendees.no_asistira.length > 0">
            <h4 class="font-semibold text-sm text-error flex items-center gap-1 mb-2">
              <span>✗</span> No asistirán ({{ groupedAttendees.no_asistira.length }})
            </h4>
            <div class="flex flex-wrap gap-2">
              <div 
                v-for="attendee in groupedAttendees.no_asistira" 
                :key="attendee.id"
                class="badge badge-error gap-1"
              >
                {{ attendee.user?.name || 'Usuario' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-action">
        <button class="btn" @click="close">Cerrar</button>
      </div>
    </div>
    <div class="modal-backdrop bg-black/50" @click="close"></div>
  </div>
</template>
