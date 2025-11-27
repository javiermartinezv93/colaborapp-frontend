<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useActivitiesStore } from '@/stores/activities'
import ActivitiesMapView from '@/components/map/ActivitiesMapView.vue'
import { MapIcon, FunnelIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const activitiesStore = useActivitiesStore()

const loading = computed(() => activitiesStore.loading)
const activities = computed(() => activitiesStore.filteredActivities)
const statusFilter = ref(null)

const statusOptions = [
  { value: null, label: 'Todos los estados' },
  { value: 'programada', label: 'Programadas' },
  { value: 'finalizada', label: 'Finalizadas' }
]

onMounted(() => {
  activitiesStore.fetchActivities()
})

watch(statusFilter, (value) => {
  activitiesStore.setFilter('status', value)
})

function handleActivityClick(activity) {
  router.push({ name: 'activity-detail', params: { id: activity.id } })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <MapIcon class="w-7 h-7 text-primary" />
          Mapa de Actividades
        </h1>
        <p class="text-base-content/60 mt-1">
          Visualiza todas las actividades en el mapa
        </p>
      </div>

      <!-- Status filter -->
      <div class="flex items-center gap-2">
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
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Map -->
    <div v-else class="card bg-base-100 shadow-lg">
      <div class="card-body p-0">
        <div class="h-[calc(100vh-220px)] min-h-[500px]">
          <ActivitiesMapView 
            :activities="activities"
            @activity-click="handleActivityClick"
          />
        </div>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-4 justify-center text-sm">
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
    </div>
  </div>
</template>
