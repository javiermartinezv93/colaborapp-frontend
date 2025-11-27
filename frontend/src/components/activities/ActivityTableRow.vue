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
  EyeIcon
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
  return dayjs(props.activity.start_datetime).format('DD/MM/YYYY')
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
    if (status === '') {
      // Remove attendance if status is empty
      if (index !== -1) {
        attendees.value.splice(index, 1)
      }
      myAttendance.value = null
    } else {
      if (index !== -1) {
        attendees.value[index] = result
      } else {
        attendees.value.push(result)
      }
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
  <tr class="hover">
    <!-- Activity title and description -->
    <td class="max-w-xs">
      <div class="space-y-1">
        <div class="font-medium line-clamp-1">{{ activity.title }}</div>
        <div v-if="activity.description" class="text-sm text-base-content/60 line-clamp-2">
          {{ activity.description }}
        </div>
      </div>
    </td>

    <!-- Type -->
    <td>
      <span :class="['badge badge-sm', typeClass]">
        {{ activitiesStore.getActivityTypeLabel(activity.type) }}
      </span>
    </td>

    <!-- Date and time -->
    <td>
      <div class="space-y-1">
        <div class="flex items-center gap-1 text-sm">
          <CalendarIcon class="w-4 h-4" />
          <span>{{ formattedDate }}</span>
        </div>
        <div class="flex items-center gap-1 text-sm">
          <ClockIcon class="w-4 h-4" />
          <span>{{ formattedTime }}</span>
        </div>
      </div>
    </td>

    <!-- Status -->
    <td>
      <span :class="['badge badge-sm', statusClass]">
        {{ activitiesStore.getActivityStatusLabel(activity.status) }}
      </span>
    </td>

    <!-- My attendance -->
    <td>
      <div v-if="activity.status !== 'programada'" class="text-sm text-base-content/60">
        N/A
      </div>
      <div v-else>
        <!-- Attendance selector -->
        <select
          class="select select-sm select-bordered"
          :style="{
            'background-color': myAttendance?.status === 'asistira' ? '#dcfce7' : myAttendance?.status === 'quizas_asistira' ? '#fef3c7' : myAttendance?.status === 'no_asistira' ? '#fee2e2' : 'transparent',
            'border-color': myAttendance?.status === 'asistira' ? '#16a34a' : myAttendance?.status === 'quizas_asistira' ? '#d97706' : myAttendance?.status === 'no_asistira' ? '#dc2626' : '#d1d5db'
          }"
          :value="myAttendance?.status || ''"
          :disabled="submittingAttendance"
          @change="setAttendance($event.target.value)"
        >
          <option value="">Sin confirmar</option>
          <option value="asistira">Asistiré</option>
          <option value="quizas_asistira">Quizás</option>
          <option value="no_asistira">No asistiré</option>
        </select>
      </div>
    </td>

    <!-- Actions -->
    <td>
      <button
        class="btn btn-ghost btn-sm btn-square"
        @click="viewDetails"
        title="Ver detalles"
      >
        <EyeIcon class="w-4 h-4" />
      </button>
    </td>
  </tr>
</template>