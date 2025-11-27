<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useActivitiesStore } from '@/stores/activities'
import ActivitiesMapView from '@/components/map/ActivitiesMapView.vue'
import { MapIcon, FunnelIcon, PlusIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const activitiesStore = useActivitiesStore()

const loading = computed(() => activitiesStore.loading)
const activities = computed(() => activitiesStore.filteredActivities)
const statusFilter = ref(null)
const typeFilter = ref(null)

const statusOptions = [
  { value: null, label: 'Todos los estados' },
  { value: 'programada', label: 'Programadas' },
  { value: 'finalizada', label: 'Finalizadas' }
]

const typeOptions = [
  { value: null, label: 'Todos los tipos' },
  { value: 'casa_a_casa', label: 'Casa a Casa' },
  { value: 'volanteo', label: 'Volanteo' }
]

onMounted(() => {
  activitiesStore.fetchActivities()
})

watch(statusFilter, (value) => {
  activitiesStore.setFilter('status', value)
})

watch(typeFilter, (value) => {
  activitiesStore.setFilter('type', value)
})

function handleActivityClick(activity) {
  router.push({ name: 'edit-activity', params: { id: activity.id } })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <MapIcon class="w-7 h-7 text-primary" />
          Mapa de Gestión
        </h1>
        <p class="text-base-content/60 mt-1">
          Visualiza y gestiona actividades desde el mapa
        </p>
      </div>

      <router-link to="/admin/actividades/crear" class="btn btn-primary gap-2">
        <PlusIcon class="w-5 h-5" />
        Nueva Actividad
      </router-link>
    </div>

    <!-- Filters -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4">
        <div class="flex flex-wrap items-center gap-4">
          <FunnelIcon class="w-5 h-5 text-base-content/50" />
          
          <select 
            v-model="statusFilter"
            class="select select-bordered select-sm"
          >
            <option 
              v-for="option in statusOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <select 
            v-model="typeFilter"
            class="select select-bordered select-sm"
          >
            <option 
              v-for="option in typeOptions" 
              :key="option.value" 
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>

          <span class="text-sm text-base-content/60">
            {{ activities.length }} actividad{{ activities.length !== 1 ? 'es' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Map -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="h-[calc(100vh-320px)] min-h-[500px]">
          <ActivitiesMapView 
            :activities="activities"
            :show-edit-button="true"
            @activity-click="handleActivityClick"
          />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-3">
        <div class="flex flex-wrap gap-6 justify-center text-sm">
          <div class="flex items-center gap-2">
            <span class="font-medium">Estados:</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-blue-500"></span>
            <span>Programada</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-green-500"></span>
            <span>Finalizada</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded bg-red-500"></span>
            <span>Cancelada</span>
          </div>
          <div class="divider divider-horizontal"></div>
          <div class="flex items-center gap-2">
            <span class="font-medium">Tipos:</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 border-2 border-primary bg-primary/30"></span>
            <span>Casa a Casa (área)</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="w-4 h-4 rounded-full bg-secondary"></span>
            <span>Volanteo (punto)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
