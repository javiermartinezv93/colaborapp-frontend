<script setup>
import { computed, onMounted } from 'vue'
import { useActivitiesStore } from '@/stores/activities'
import { useAuthStore } from '@/stores/auth'
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  PlusIcon,
  ArrowTrendingUpIcon
} from '@heroicons/vue/24/outline'

const activitiesStore = useActivitiesStore()
const authStore = useAuthStore()

const loading = computed(() => activitiesStore.loading)
const programmed = computed(() => activitiesStore.programmedActivities.length)
const finished = computed(() => activitiesStore.finishedActivities.length)
const total = computed(() => activitiesStore.activities.filter(a => a.status !== 'cancelada').length)

// Recent activities (last 5)
const recentActivities = computed(() => {
  return [...activitiesStore.activities]
    .filter(a => a.status !== 'cancelada')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5)
})

onMounted(() => {
  activitiesStore.fetchActivities()
})

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome header -->
    <div class="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-primary-content">
      <h1 class="text-2xl font-bold">
        ¡Hola, {{ authStore.user?.username }}! 👋
      </h1>
      <p class="opacity-90 mt-1">
        Bienvenido al panel de administración de actividades
      </p>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total -->
      <div class="stat bg-base-100 rounded-box shadow">
        <div class="stat-figure text-primary">
          <CalendarIcon class="w-8 h-8" />
        </div>
        <div class="stat-title">Total Actividades</div>
        <div class="stat-value text-primary">{{ total }}</div>
      </div>

      <!-- Programmed -->
      <div class="stat bg-base-100 rounded-box shadow">
        <div class="stat-figure text-info">
          <ClockIcon class="w-8 h-8" />
        </div>
        <div class="stat-title">Programadas</div>
        <div class="stat-value text-info">{{ programmed }}</div>
      </div>

      <!-- Finished -->
      <div class="stat bg-base-100 rounded-box shadow">
        <div class="stat-figure text-success">
          <CheckCircleIcon class="w-8 h-8" />
        </div>
        <div class="stat-title">Finalizadas</div>
        <div class="stat-value text-success">{{ finished }}</div>
      </div>
    </div>

    <!-- Quick actions -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">
          <ArrowTrendingUpIcon class="w-5 h-5 text-primary" />
          Acciones Rápidas
        </h2>
        <div class="flex flex-wrap gap-3 mt-2">
          <router-link to="/admin/actividades/crear" class="btn btn-primary gap-2">
            <PlusIcon class="w-5 h-5" />
            Nueva Actividad
          </router-link>
          <router-link to="/admin/actividades" class="btn btn-outline gap-2">
            <CalendarIcon class="w-5 h-5" />
            Ver Actividades
          </router-link>
          <router-link to="/admin/mapa" class="btn btn-outline gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Ver Mapa
          </router-link>
        </div>
      </div>
    </div>

    <!-- Recent activities -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title">
          <CalendarIcon class="w-5 h-5 text-primary" />
          Actividades Recientes
        </h2>

        <div v-if="loading" class="flex justify-center py-8">
          <span class="loading loading-spinner loading-md"></span>
        </div>

        <div v-else-if="recentActivities.length === 0" class="text-center py-8 text-base-content/60">
          No hay actividades aún
        </div>

        <div v-else class="overflow-x-auto mt-2">
          <table class="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in recentActivities" :key="activity.id">
                <td class="font-medium">{{ activity.title }}</td>
                <td>
                  <span 
                    :class="[
                      'badge badge-sm',
                      activity.type === 'casa_a_casa' ? 'badge-primary' : 'badge-secondary'
                    ]"
                  >
                    {{ activitiesStore.getActivityTypeLabel(activity.type) }}
                  </span>
                </td>
                <td>
                  <span 
                    :class="[
                      'badge badge-sm',
                      activity.status === 'programada' ? 'badge-info' :
                      activity.status === 'finalizada' ? 'badge-success' : 'badge-error'
                    ]"
                  >
                    {{ activitiesStore.getActivityStatusLabel(activity.status) }}
                  </span>
                </td>
                <td class="text-base-content/60 text-sm">
                  {{ formatDate(activity.start_datetime) }}
                </td>
                <td>
                  <router-link 
                    :to="{ name: 'activity-detail', params: { id: activity.id } }"
                    class="btn btn-ghost btn-xs"
                  >
                    Ver
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="card-actions justify-end mt-2">
          <router-link to="/admin/actividades" class="btn btn-ghost btn-sm">
            Ver todas →
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
