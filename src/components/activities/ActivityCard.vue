<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useActivitiesStore } from '@/stores/activities'
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon,
  ChevronRightIcon
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

function viewDetails() {
  router.push({ name: 'activity-detail', params: { id: props.activity.id } })
}
</script>

<template>
  <div 
    class="card bg-base-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
    :class="{ 'opacity-75': activity.status === 'cancelada' }"
    @click="viewDetails"
  >
    <div class="card-body p-5">
      <!-- Badges -->
      <div class="flex flex-wrap gap-2 mb-2">
        <span :class="['badge badge-sm', typeClass]">
          {{ activitiesStore.getActivityTypeLabel(activity.type) }}
        </span>
        <span :class="['badge badge-sm', statusClass]">
          {{ activitiesStore.getActivityStatusLabel(activity.status) }}
        </span>
      </div>

      <!-- Title -->
      <h3 class="card-title text-base line-clamp-1">
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
      <div class="flex flex-wrap gap-4 mt-3 text-sm text-base-content/70">
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

      <!-- Action arrow -->
      <div class="absolute top-1/2 right-4 -translate-y-1/2">
        <ChevronRightIcon class="w-5 h-5 text-base-content/30" />
      </div>
    </div>
  </div>
</template>
