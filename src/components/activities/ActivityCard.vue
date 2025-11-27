<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivitiesStore } from '@/stores/activities'
import { useAttendanceStore } from '@/stores/attendance'
import { useAuthStore } from '@/stores/auth'
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const props = defineProps({
  activity: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const activitiesStore = useActivitiesStore()
const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

const attendees = ref([])
const myAttendance = ref(null)
const loadingAttendance = ref(false)
const submittingAttendance = ref(false)

const formattedDate = computed(() => {
  return dayjs(props.activity.start_datetime).format('DD MMM YYYY')
})

const formattedTime = computed(() => {
  return dayjs(props.activity.start_datetime).format('HH:mm')
})

const statusClass = computed(() => {
  const classes = {
    'programada': 'badge-info',
    'cancelada': 'badge-error',
    'finalizada': 'badge-success'
  }
  return classes[props.activity.status] || 'badge-neutral'
})

const typeClass = computed(() => {
  return props.activity.type === 'casa_a_casa' ? 'badge-primary' : 'badge-secondary'
})

const isPast = computed(() => {
  return new Date(props.activity.start_datetime) < new Date()
})

const attendanceCounts = computed(() => {
  const counts = {
    asistira: 0,
    no_asistira: 0,
    quizas_asistira: 0
  }
  attendees.value.forEach(a => {
    if (counts[a.status] !== undefined) {
      counts[a.status]++
    }
  })
  return counts
})

const totalAttendees = computed(() => {
  return attendees.value.length
})

onMounted(async () => {
  if (props.activity.status === 'programada') {
    loadingAttendance.value = true
    try {
      const data = await attendanceStore.getActivityAttendance(props.activity.id)
      attendees.value = data
      
      // Find my attendance
      myAttendance.value = attendees.value.find(
        a => a.user_id === authStore.user?.id
      )
    } catch (error) {
      console.error('Error loading attendees:', error)
    } finally {
      loadingAttendance.value = false
    }
  }
})

async function setAttendance(status) {
  submittingAttendance.value = true
  try {
    const result = await attendanceStore.registerAttendance({
      activity_id: props.activity.id,
      status
    })
    myAttendance.value = result
    
    // Update local attendees
    const index = attendees.value.findIndex(a => a.user_id === authStore.user?.id)
    if (index !== -1) {
      attendees.value[index] = result
    } else {
      attendees.value.push(result)
    }
  } catch (error) {
    console.error('Error registering attendance:', error)
  } finally {
    submittingAttendance.value = false
  }
}

function viewDetails() {
  router.push({ name: 'activity-detail', params: { id: props.activity.id } })
}
</script>

<template>
  <div 
    class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow"
    :class="{ 'opacity-75': activity.status === 'cancelada' }"
  >
    <div class="card-body p-5 space-y-3">
      <!-- Badges -->
      <div class="flex flex-wrap gap-2">
        <span :class="['badge badge-sm', typeClass]">
          {{ activitiesStore.getActivityTypeLabel(activity.type) }}
        </span>
        <span :class="['badge badge-sm', statusClass]">
          {{ activitiesStore.getActivityStatusLabel(activity.status) }}
        </span>
      </div>

      <!-- Title -->
      <h3 class="card-title text-base line-clamp-1 cursor-pointer hover:text-primary" @click="viewDetails">
        {{ activity.title }}
      </h3>

      <!-- Description -->
      <p 
        v-if="activity.description" 
        class="text-sm text-base-content/60 line-clamp-2"
      >
        {{ activity.description }}
      </p>

      <!-- Meta info -->
      <div class="flex flex-wrap gap-3 text-sm text-base-content/70">
        <div class="flex items-center gap-1.5">
          <CalendarIcon class="w-4 h-4" />
          <span>{{ formattedDate }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <ClockIcon class="w-4 h-4" />
          <span>{{ formattedTime }}</span>
        </div>
        <div class="flex items-center gap-1.5">
          <MapPinIcon class="w-4 h-4" />
          <span>{{ activity.type === 'volanteo' ? 'Punto' : 'Área' }}</span>
        </div>
      </div>

      <!-- Attendees info and attendance buttons -->
      <div v-if="activity.status === 'programada'" class="space-y-2 pt-2 border-t border-base-300">
        <!-- Attendees count -->
        <div v-if="!loadingAttendance" class="flex items-center gap-2 text-sm">
          <UsersIcon class="w-4 h-4 text-primary" />
          <span class="font-medium">{{ totalAttendees }} participante{{ totalAttendees !== 1 ? 's' : '' }}</span>
          <div class="flex gap-1 text-xs">
            <span v-if="attendanceCounts.asistira > 0" class="badge badge-success badge-sm">
              ✓ {{ attendanceCounts.asistira }}
            </span>
            <span v-if="attendanceCounts.quizas_asistira > 0" class="badge badge-warning badge-sm">
              ? {{ attendanceCounts.quizas_asistira }}
            </span>
            <span v-if="attendanceCounts.no_asistira > 0" class="badge badge-error badge-sm">
              ✗ {{ attendanceCounts.no_asistira }}
            </span>
          </div>
        </div>

        <!-- Attendance buttons -->
        <div class="flex gap-1.5 flex-wrap">
          <button 
            class="btn btn-xs gap-1"
            :class="myAttendance?.status === 'asistira' ? 'btn-success' : 'btn-outline btn-success'"
            :disabled="submittingAttendance"
            @click.stop="setAttendance('asistira')"
          >
            <CheckCircleIcon class="w-3 h-3" />
            <span class="hidden sm:inline">Asistiré</span>
          </button>
          <button 
            class="btn btn-xs gap-1"
            :class="myAttendance?.status === 'quizas_asistira' ? 'btn-warning' : 'btn-outline btn-warning'"
            :disabled="submittingAttendance"
            @click.stop="setAttendance('quizas_asistira')"
          >
            <QuestionMarkCircleIcon class="w-3 h-3" />
            <span class="hidden sm:inline">Quizás</span>
          </button>
          <button 
            class="btn btn-xs gap-1"
            :class="myAttendance?.status === 'no_asistira' ? 'btn-error' : 'btn-outline btn-error'"
            :disabled="submittingAttendance"
            @click.stop="setAttendance('no_asistira')"
          >
            <XCircleIcon class="w-3 h-3" />
            <span class="hidden sm:inline">No asistiré</span>
          </button>
        </div>
      </div>

      <!-- View details button -->
      <button 
        class="btn btn-ghost btn-sm w-full mt-auto"
        @click="viewDetails"
      >
        Ver detalles
        <ChevronRightIcon class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
