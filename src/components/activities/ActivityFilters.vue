<script setup>
import { computed } from 'vue'
import { useActivitiesStore } from '@/stores/activities'
import { FunnelIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const activitiesStore = useActivitiesStore()

const filters = computed(() => activitiesStore.filters)
const hasFilters = computed(() => {
  return filters.value.status || filters.value.type || filters.value.search
})

function setStatus(status) {
  activitiesStore.setFilter('status', status === filters.value.status ? null : status)
}

function setType(type) {
  activitiesStore.setFilter('type', type === filters.value.type ? null : type)
}

function setSearch(event) {
  activitiesStore.setFilter('search', event.target.value)
}

function clearFilters() {
  activitiesStore.clearFilters()
}
</script>

<template>
  <div class="card bg-base-100 shadow">
    <div class="card-body py-4">
      <div class="flex flex-col gap-4">
        <!-- Search -->
        <label class="input input-bordered input-sm flex items-center gap-2 max-w-md">
          <MagnifyingGlassIcon class="w-4 h-4 text-base-content/50" />
          <input 
            type="text" 
            placeholder="Buscar actividades..."
            class="grow"
            :value="filters.search"
            @input="setSearch"
          />
        </label>

        <!-- Filter buttons -->
        <div class="flex flex-wrap items-center gap-3">
          <span class="text-sm text-base-content/60 flex items-center gap-1">
            <FunnelIcon class="w-4 h-4" />
            Filtros:
          </span>

          <!-- Status filters -->
          <div class="flex gap-1">
            <button 
              :class="[
                'btn btn-xs',
                filters.status === 'programada' ? 'btn-info' : 'btn-ghost'
              ]"
              @click="setStatus('programada')"
            >
              Programadas
            </button>
            <button 
              :class="[
                'btn btn-xs',
                filters.status === 'finalizada' ? 'btn-success' : 'btn-ghost'
              ]"
              @click="setStatus('finalizada')"
            >
              Finalizadas
            </button>
          </div>

          <div class="divider divider-horizontal mx-0"></div>

          <!-- Type filters -->
          <div class="flex gap-1">
            <button 
              :class="[
                'btn btn-xs',
                filters.type === 'casa_a_casa' ? 'btn-primary' : 'btn-ghost'
              ]"
              @click="setType('casa_a_casa')"
            >
              Casa a Casa
            </button>
            <button 
              :class="[
                'btn btn-xs',
                filters.type === 'volanteo' ? 'btn-secondary' : 'btn-ghost'
              ]"
              @click="setType('volanteo')"
            >
              Volanteo
            </button>
          </div>

          <!-- Clear filters -->
          <button 
            v-if="hasFilters"
            class="btn btn-xs btn-ghost gap-1"
            @click="clearFilters"
          >
            <XMarkIcon class="w-3 h-3" />
            Limpiar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
