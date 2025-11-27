<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useActivitiesStore } from '@/stores/activities'
import { useAuthStore } from '@/stores/auth'
import ActivityFilters from '@/components/activities/ActivityFilters.vue'
import { 
  CalendarIcon, 
  PlusIcon, 
  PencilIcon,
  EyeIcon,
  XMarkIcon,
  CheckIcon,
  FunnelIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const router = useRouter()
const activitiesStore = useActivitiesStore()
const authStore = useAuthStore()

const activities = computed(() => activitiesStore.filteredActivities)
const loading = computed(() => activitiesStore.loading)

onMounted(() => {
  activitiesStore.fetchActivities()
})

function formatDate(dateStr) {
  return dayjs(dateStr).format('DD/MM/YYYY HH:mm')
}

function canEdit(activity) {
  // Admin can edit any, coordinator can only edit their own
  if (authStore.isAdmin) return true
  return activity.created_by === authStore.user?.id
}

function canChangeStatus(activity) {
  return activity.status === 'programada' && canEdit(activity)
}

async function handleCancel(activity) {
  if (!confirm('¿Estás seguro de que deseas cancelar esta actividad?')) return
  await activitiesStore.cancelActivity(activity.id)
}

async function handleFinish(activity) {
  if (!confirm('¿Estás seguro de que deseas marcar esta actividad como finalizada?')) return
  await activitiesStore.finishActivity(activity.id)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon class="w-7 h-7 text-primary" />
          Gestión de Actividades
        </h1>
        <p class="text-base-content/60 mt-1">
          Administra todas las actividades del sistema
        </p>
      </div>

      <router-link to="/admin/actividades/crear" class="btn btn-primary gap-2">
        <PlusIcon class="w-5 h-5" />
        Nueva Actividad
      </router-link>
    </div>

    <!-- Filters -->
    <ActivityFilters />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="activities.length === 0" class="card bg-base-100 shadow">
      <div class="card-body text-center py-12">
        <CalendarIcon class="w-16 h-16 mx-auto text-base-content/30" />
        <h3 class="text-lg font-medium mt-4">No hay actividades</h3>
        <p class="text-base-content/60 mt-1">
          Crea tu primera actividad para comenzar
        </p>
        <div class="card-actions justify-center mt-4">
          <router-link to="/admin/actividades/crear" class="btn btn-primary gap-2">
            <PlusIcon class="w-5 h-5" />
            Crear Actividad
          </router-link>
        </div>
      </div>
    </div>

    <!-- Activities table -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Tipo</th>
                <th>Fecha/Hora</th>
                <th>Estado</th>
                <th>Creador</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="activity in activities" :key="activity.id" class="hover">
                <td>
                  <div class="font-medium">{{ activity.title }}</div>
                  <div class="text-sm text-base-content/60 truncate max-w-xs">
                    {{ activity.description || 'Sin descripción' }}
                  </div>
                </td>
                <td>
                  <span 
                    :class="[
                      'badge',
                      activity.type === 'casa_a_casa' ? 'badge-primary' : 'badge-secondary'
                    ]"
                  >
                    {{ activitiesStore.getActivityTypeLabel(activity.type) }}
                  </span>
                </td>
                <td class="text-sm">
                  {{ formatDate(activity.start_datetime) }}
                </td>
                <td>
                  <span 
                    :class="[
                      'badge',
                      activity.status === 'programada' ? 'badge-info' :
                      activity.status === 'finalizada' ? 'badge-success' : 'badge-error'
                    ]"
                  >
                    {{ activitiesStore.getActivityStatusLabel(activity.status) }}
                  </span>
                </td>
                <td class="text-sm text-base-content/60">
                  {{ activity.creator?.username || 'N/A' }}
                </td>
                <td>
                  <div class="flex justify-end gap-1">
                    <!-- View -->
                    <router-link 
                      :to="{ name: 'activity-detail', params: { id: activity.id } }"
                      class="btn btn-ghost btn-sm btn-square"
                      title="Ver detalle"
                    >
                      <EyeIcon class="w-4 h-4" />
                    </router-link>

                    <!-- Edit (only if can edit and is programmed) -->
                    <router-link 
                      v-if="canEdit(activity) && activity.status === 'programada'"
                      :to="{ name: 'edit-activity', params: { id: activity.id } }"
                      class="btn btn-ghost btn-sm btn-square"
                      title="Editar"
                    >
                      <PencilIcon class="w-4 h-4" />
                    </router-link>

                    <!-- Finish -->
                    <button 
                      v-if="canChangeStatus(activity)"
                      class="btn btn-ghost btn-sm btn-square text-success"
                      title="Marcar como finalizada"
                      @click="handleFinish(activity)"
                    >
                      <CheckIcon class="w-4 h-4" />
                    </button>

                    <!-- Cancel -->
                    <button 
                      v-if="canChangeStatus(activity)"
                      class="btn btn-ghost btn-sm btn-square text-error"
                      title="Cancelar actividad"
                      @click="handleCancel(activity)"
                    >
                      <XMarkIcon class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Results count -->
    <div class="text-center text-sm text-base-content/60">
      Mostrando {{ activities.length }} actividad{{ activities.length !== 1 ? 'es' : '' }}
    </div>
  </div>
</template>
