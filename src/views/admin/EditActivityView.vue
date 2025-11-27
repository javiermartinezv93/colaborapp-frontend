<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useActivitiesStore } from '@/stores/activities'
import ActivityFormMap from '@/components/map/ActivityFormMap.vue'
import { 
  ArrowLeftIcon,
  CalendarIcon,
  MapPinIcon,
  DocumentTextIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const activitiesStore = useActivitiesStore()

const activityId = route.params.id
const loading = ref(true)
const form = ref({
  title: '',
  description: '',
  start_datetime: '',
  end_datetime: '',
  polygon_geojson: null,
  marker_lat: null,
  marker_lng: null
})
const activityType = ref('casa_a_casa')

const errors = ref({})
const submitting = ref(false)

onMounted(async () => {
  try {
    const activity = await activitiesStore.fetchActivity(activityId)
    
    activityType.value = activity.type
    form.value = {
      title: activity.title,
      description: activity.description || '',
      start_datetime: dayjs(activity.start_datetime).format('YYYY-MM-DDTHH:mm'),
      end_datetime: activity.end_datetime 
        ? dayjs(activity.end_datetime).format('YYYY-MM-DDTHH:mm') 
        : '',
      polygon_geojson: activity.polygon_geojson,
      marker_lat: activity.marker_lat,
      marker_lng: activity.marker_lng
    }
  } catch (error) {
    router.push({ name: 'activities-management' })
  } finally {
    loading.value = false
  }
})

// Validate form
function validate() {
  errors.value = {}

  if (!form.value.title.trim()) {
    errors.value.title = 'El título es requerido'
  }

  if (!form.value.start_datetime) {
    errors.value.start_datetime = 'La fecha de inicio es requerida'
  }

  if (activityType.value === 'casa_a_casa' && !form.value.polygon_geojson) {
    errors.value.geometry = 'Debes dibujar un área en el mapa'
  }

  if (activityType.value === 'volanteo' && (!form.value.marker_lat || !form.value.marker_lng)) {
    errors.value.geometry = 'Debes marcar un punto en el mapa'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    const data = {
      title: form.value.title.trim(),
      description: form.value.description.trim() || null,
      start_datetime: new Date(form.value.start_datetime).toISOString(),
      end_datetime: form.value.end_datetime 
        ? new Date(form.value.end_datetime).toISOString() 
        : null
    }

    if (activityType.value === 'casa_a_casa') {
      // Extract geometry from the object emitted by ActivityFormMap
      const geomData = form.value.polygon_geojson
      if (geomData && geomData.polygon) {
        // If it's the custom format { type, polygon, marker }, extract polygon
        data.polygon_geojson = geomData.polygon
      } else if (geomData && (geomData.type === 'Polygon' || geomData.type === 'Feature')) {
        // If it's already a valid GeoJSON geometry or feature, use it
        data.polygon_geojson = geomData.type === 'Feature' ? geomData.geometry : geomData
      } else {
        data.polygon_geojson = geomData
      }
      data.marker_lat = null
      data.marker_lng = null
    } else {
      data.polygon_geojson = null
      data.marker_lat = form.value.marker_lat
      data.marker_lng = form.value.marker_lng
    }

    await activitiesStore.updateActivity(activityId, data)
    router.push({ name: 'activities-management' })
  } catch (error) {
    errors.value.submit = activitiesStore.error || 'Error al actualizar la actividad'
  } finally {
    submitting.value = false
  }
}

function handleGeometryChange(geometry) {
  if (activityType.value === 'casa_a_casa') {
    form.value.polygon_geojson = geometry
    form.value.marker_lat = null
    form.value.marker_lng = null
  } else {
    form.value.polygon_geojson = null
    // Extract marker coordinates from geometry object
    if (geometry?.marker) {
      form.value.marker_lat = geometry.marker.lat || null
      form.value.marker_lng = geometry.marker.lng || null
    } else {
      // Fallback for direct lat/lng (if emitted differently)
      form.value.marker_lat = geometry?.lat || null
      form.value.marker_lng = geometry?.lng || null
    }
  }
  delete errors.value.geometry
}

const initialGeometry = computed(() => {
  if (activityType.value === 'casa_a_casa' && form.value.polygon_geojson) {
    return form.value.polygon_geojson
  }
  if (activityType.value === 'volanteo' && form.value.marker_lat && form.value.marker_lng) {
    return { lat: form.value.marker_lat, lng: form.value.marker_lng }
  }
  return null
})

function goBack() {
  router.back()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <button class="btn btn-ghost btn-sm btn-square" @click="goBack">
        <ArrowLeftIcon class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold">Editar Actividad</h1>
        <p class="text-base-content/60">Modifica los datos de la actividad</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Submit error -->
      <div v-if="errors.submit" class="alert alert-error">
        <ExclamationCircleIcon class="w-5 h-5" />
        <span>{{ errors.submit }}</span>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Left column - Form fields -->
        <div class="space-y-6">
          <!-- Basic info card -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title text-lg">
                <DocumentTextIcon class="w-5 h-5 text-primary" />
                Información Básica
              </h2>

              <!-- Activity type (readonly) -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Tipo de Actividad</span>
                </label>
                <div class="flex items-center gap-2">
                  <span 
                    :class="[
                      'badge',
                      activityType === 'casa_a_casa' ? 'badge-primary' : 'badge-secondary'
                    ]"
                  >
                    {{ activityType === 'casa_a_casa' ? 'Casa a Casa' : 'Volanteo' }}
                  </span>
                  <span class="text-sm text-base-content/60">(no editable)</span>
                </div>
              </div>

              <!-- Title -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Título</span>
                </label>
                <input 
                  v-model="form.title"
                  type="text" 
                  class="input input-bordered"
                  :class="{ 'input-error': errors.title }"
                  placeholder="Ej: Recorrido por sector norte"
                  maxlength="255"
                />
                <label v-if="errors.title" class="label">
                  <span class="label-text-alt text-error">{{ errors.title }}</span>
                </label>
              </div>

              <!-- Description -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Descripción (opcional)</span>
                </label>
                <textarea 
                  v-model="form.description"
                  class="textarea textarea-bordered h-24"
                  placeholder="Detalles adicionales de la actividad..."
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Date/Time card -->
          <div class="card bg-base-100 shadow">
            <div class="card-body">
              <h2 class="card-title text-lg">
                <CalendarIcon class="w-5 h-5 text-primary" />
                Fecha y Hora
              </h2>

              <!-- Start datetime -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Fecha y hora de inicio</span>
                </label>
                <input 
                  v-model="form.start_datetime"
                  type="datetime-local" 
                  class="input input-bordered"
                  :class="{ 'input-error': errors.start_datetime }"
                />
                <label v-if="errors.start_datetime" class="label">
                  <span class="label-text-alt text-error">{{ errors.start_datetime }}</span>
                </label>
              </div>

              <!-- End datetime -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Fecha y hora de término (opcional)</span>
                </label>
                <input 
                  v-model="form.end_datetime"
                  type="datetime-local" 
                  class="input input-bordered"
                  :min="form.start_datetime"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Right column - Map -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title text-lg">
              <MapPinIcon class="w-5 h-5 text-primary" />
              Ubicación
              <span 
                :class="[
                  'badge badge-sm',
                  activityType === 'casa_a_casa' ? 'badge-primary' : 'badge-secondary'
                ]"
              >
                {{ activityType === 'casa_a_casa' ? 'Dibujar área' : 'Marcar punto' }}
              </span>
            </h2>

            <p class="text-sm text-base-content/60">
              {{ activityType === 'casa_a_casa' 
                ? 'Modifica el polígono del área donde se realizará la actividad.' 
                : 'Modifica el punto de encuentro para el volanteo.' 
              }}
            </p>

            <div 
              class="h-[400px] lg:h-[500px] rounded-lg overflow-hidden border border-base-300 mt-2"
              :class="{ 'border-error': errors.geometry }"
            >
              <ActivityFormMap 
                :activity-type="activityType"
                :initial-geometry="initialGeometry"
                @geometry-change="handleGeometryChange"
              />
            </div>

            <label v-if="errors.geometry" class="label">
              <span class="label-text-alt text-error">{{ errors.geometry }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Submit buttons -->
      <div class="flex justify-end gap-3">
        <button 
          type="button" 
          class="btn btn-ghost"
          @click="goBack"
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          class="btn btn-primary"
          :class="{ 'loading': submitting }"
          :disabled="submitting"
        >
          {{ submitting ? 'Guardando...' : 'Guardar Cambios' }}
        </button>
      </div>
    </form>
  </div>
</template>
