<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useActivitiesStore } from '@/stores/activities'
import { useAttendanceStore } from '@/stores/attendance'
import { useAuthStore } from '@/stores/auth'
import ActivityMap from '@/components/map/ActivityMap.vue'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UserIcon,
  UsersIcon,
  CheckCircleIcon,
  XCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const activitiesStore = useActivitiesStore()
const attendanceStore = useAttendanceStore()
const authStore = useAuthStore()

const activity = ref(null)
const loading = ref(true)
const attendances = ref([])
const myAttendance = ref(null)
const submittingAttendance = ref(false)

onMounted(async () => {
  try {
    activity.value = await activitiesStore.fetchActivity(route.params.id)
    attendances.value = await attendanceStore.fetchActivityAttendances(route.params.id)
    
    // Find my attendance
    myAttendance.value = attendances.value.find(
      a => a.user_id === authStore.user?.id
    )
  } catch (error) {
    router.push({ name: 'volunteer-activities' })
  } finally {
    loading.value = false
  }
})

const formattedDate = computed(() => {
  if (!activity.value) return ''
  return dayjs(activity.value.start_datetime).format('dddd, D [de] MMMM [de] YYYY')
})

const formattedTime = computed(() => {
  if (!activity.value) return ''
  const start = dayjs(activity.value.start_datetime).format('HH:mm')
  if (activity.value.end_datetime) {
    const end = dayjs(activity.value.end_datetime).format('HH:mm')
    return `${start} - ${end}`
  }
  return start
})

const statusBadge = computed(() => {
  if (!activity.value) return {}
  const badges = {
    'programada': { class: 'badge-info', text: 'Programada' },
    'cancelada': { class: 'badge-error', text: 'Cancelada' },
    'finalizada': { class: 'badge-success', text: 'Finalizada' }
  }
  return badges[activity.value.status] || {}
})

const typeBadge = computed(() => {
  if (!activity.value) return {}
  const badges = {
    'casa_a_casa': { class: 'badge-primary', text: 'Casa a Casa' },
    'volanteo': { class: 'badge-secondary', text: 'Volanteo' }
  }
  return badges[activity.value.type] || {}
})

const attendanceCounts = computed(() => {
  const counts = {
    asistira: 0,
    no_asistira: 0,
    quizas_asistira: 0
  }
  attendances.value.forEach(a => {
    if (counts[a.status] !== undefined) {
      counts[a.status]++
    }
  })
  return counts
})

async function setAttendance(status) {
  submittingAttendance.value = true
  try {
    const result = await attendanceStore.registerAttendance({
      activity_id: route.params.id,
      status
    })
    myAttendance.value = result
    
    // Update local attendances
    const index = attendances.value.findIndex(a => a.user_id === authStore.user?.id)
    if (index !== -1) {
      attendances.value[index] = result
    } else {
      attendances.value.push(result)
    }
  } finally {
    submittingAttendance.value = false
  }
}

function goBack() {
  router.back()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Back button -->
    <button class="btn btn-ghost btn-sm gap-2" @click="goBack">
      <ArrowLeftIcon class="w-4 h-4" />
      Volver
    </button>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <template v-else-if="activity">
      <!-- Header -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <div class="flex flex-wrap gap-2 mb-2">
            <span :class="['badge', typeBadge.class]">{{ typeBadge.text }}</span>
            <span :class="['badge', statusBadge.class]">{{ statusBadge.text }}</span>
          </div>
          
          <h1 class="card-title text-2xl">{{ activity.title }}</h1>
          
          <p v-if="activity.description" class="text-base-content/70 mt-2">
            {{ activity.description }}
          </p>

          <div class="divider"></div>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Date -->
            <div class="flex items-start gap-3">
              <CalendarIcon class="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p class="font-medium">Fecha</p>
                <p class="text-base-content/60 text-sm">{{ formattedDate }}</p>
              </div>
            </div>

            <!-- Time -->
            <div class="flex items-start gap-3">
              <ClockIcon class="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p class="font-medium">Hora</p>
                <p class="text-base-content/60 text-sm">{{ formattedTime }}</p>
              </div>
            </div>

            <!-- Location -->
            <div class="flex items-start gap-3">
              <MapPinIcon class="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p class="font-medium">Ubicación</p>
                <p class="text-base-content/60 text-sm">
                  {{ activity.type === 'volanteo' ? 'Punto de encuentro en mapa' : 'Área marcada en mapa' }}
                </p>
              </div>
            </div>

            <!-- Creator -->
            <div class="flex items-start gap-3">
              <UserIcon class="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p class="font-medium">Creado por</p>
                <p class="text-base-content/60 text-sm">{{ activity.creator?.username || 'Usuario' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map -->
      <div class="card bg-base-100 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-lg">
            <MapPinIcon class="w-5 h-5 text-primary" />
            Ubicación
          </h2>
          <div class="h-[400px] rounded-lg overflow-hidden mt-2">
            <ActivityMap 
              :activity="activity"
              :readonly="true"
            />
          </div>
        </div>
      </div>

      <!-- Attendance -->
      <div class="card bg-base-100 shadow-lg" v-if="activity.status === 'programada'">
        <div class="card-body">
          <h2 class="card-title text-lg">
            <UsersIcon class="w-5 h-5 text-primary" />
            Asistencia
          </h2>

          <!-- Stats -->
          <div class="stats stats-vertical sm:stats-horizontal shadow bg-base-200 mt-2">
            <div class="stat">
              <div class="stat-figure text-success">
                <CheckCircleIcon class="w-8 h-8" />
              </div>
              <div class="stat-title">Asistirán</div>
              <div class="stat-value text-success">{{ attendanceCounts.asistira }}</div>
            </div>
            <div class="stat">
              <div class="stat-figure text-warning">
                <QuestionMarkCircleIcon class="w-8 h-8" />
              </div>
              <div class="stat-title">Quizás</div>
              <div class="stat-value text-warning">{{ attendanceCounts.quizas_asistira }}</div>
            </div>
            <div class="stat">
              <div class="stat-figure text-error">
                <XCircleIcon class="w-8 h-8" />
              </div>
              <div class="stat-title">No asistirán</div>
              <div class="stat-value text-error">{{ attendanceCounts.no_asistira }}</div>
            </div>
          </div>

          <!-- My attendance -->
          <div class="mt-4">
            <p class="font-medium mb-3">Tu respuesta:</p>
            <div class="flex flex-wrap gap-2">
              <button 
                class="btn gap-2"
                :class="myAttendance?.status === 'asistira' ? 'btn-success' : 'btn-outline btn-success'"
                :disabled="submittingAttendance"
                @click="setAttendance('asistira')"
              >
                <CheckCircleIcon class="w-5 h-5" />
                Asistiré
              </button>
              <button 
                class="btn gap-2"
                :class="myAttendance?.status === 'quizas_asistira' ? 'btn-warning' : 'btn-outline btn-warning'"
                :disabled="submittingAttendance"
                @click="setAttendance('quizas_asistira')"
              >
                <QuestionMarkCircleIcon class="w-5 h-5" />
                Quizás
              </button>
              <button 
                class="btn gap-2"
                :class="myAttendance?.status === 'no_asistira' ? 'btn-error' : 'btn-outline btn-error'"
                :disabled="submittingAttendance"
                @click="setAttendance('no_asistira')"
              >
                <XCircleIcon class="w-5 h-5" />
                No asistiré
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Attendance list for finished/cancelled -->
      <div class="card bg-base-100 shadow-lg" v-else>
        <div class="card-body">
          <h2 class="card-title text-lg">
            <UsersIcon class="w-5 h-5 text-primary" />
            Participantes ({{ attendances.length }})
          </h2>
          
          <div class="overflow-x-auto mt-2">
            <table class="table table-zebra">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="att in attendances" :key="att.id">
                  <td>{{ att.user?.username || 'Usuario' }}</td>
                  <td>
                    <span 
                      :class="[
                        'badge',
                        att.status === 'asistira' ? 'badge-success' :
                        att.status === 'quizas_asistira' ? 'badge-warning' : 'badge-error'
                      ]"
                    >
                      {{ attendanceStore.getAttendanceStatusLabel(att.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
