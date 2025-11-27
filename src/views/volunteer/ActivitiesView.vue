<script setup>
import { computed, onMounted } from 'vue'
import { useActivitiesStore } from '@/stores/activities'
import { useAuthStore } from '@/stores/auth'
import ActivityCard from '@/components/activities/ActivityCard.vue'
import ActivityFilters from '@/components/activities/ActivityFilters.vue'
import { CalendarIcon, FunnelIcon } from '@heroicons/vue/24/outline'

const activitiesStore = useActivitiesStore()
const authStore = useAuthStore()

const activities = computed(() => activitiesStore.filteredActivities)
const loading = computed(() => activitiesStore.loading)

onMounted(() => {
  activitiesStore.fetchActivities()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <CalendarIcon class="w-7 h-7 text-primary" />
          Actividades
        </h1>
        <p class="text-base-content/60 mt-1">
          Explora las actividades programadas y confirma tu asistencia
        </p>
      </div>
    </div>

    <!-- Filters -->
    <ActivityFilters />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="activities.length === 0" class="text-center py-12">
      <CalendarIcon class="w-16 h-16 mx-auto text-base-content/30" />
      <h3 class="text-lg font-medium mt-4">No hay actividades</h3>
      <p class="text-base-content/60 mt-1">
        No se encontraron actividades con los filtros seleccionados
      </p>
      <button 
        class="btn btn-ghost btn-sm mt-4"
        @click="activitiesStore.clearFilters()"
      >
        <FunnelIcon class="w-4 h-4" />
        Limpiar filtros
      </button>
    </div>

    <!-- Activities grid -->
    <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <ActivityCard
        v-for="activity in activities"
        :key="activity.id"
        :activity="activity"
      />
    </div>
  </div>
</template>
