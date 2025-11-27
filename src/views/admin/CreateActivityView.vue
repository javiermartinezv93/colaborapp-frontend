<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
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
const activitiesStore = useActivitiesStore()

const form = ref({
  type: 'casa_a_casa',
  title: '',
  description: '',
  start_datetime: '',
  end_datetime: '',
  polygon_geojson: null,
  marker_lat: null,
  marker_lng: null
})

const errors = ref({})
const submitting = ref(false)

// Format datetime for input
const today = dayjs().format('YYYY-MM-DDTHH:mm')

// Validate form
function validate() {
  errors.value = {}

  if (!form.value.title.trim()) {
    errors.value.title = 'El título es requerido'
  }

  if (!form.value.start_datetime) {
    errors.value.start_datetime = 'La fecha de inicio es requerida'
  }

  if (form.value.type === 'casa_a_casa' && !form.value.polygon_geojson) {
    errors.value.geometry = 'Debes dibujar un área en el mapa'
  }

  if (form.value.type === 'volanteo' && (!form.value.marker_lat || !form.value.marker_lng)) {
    errors.value.geometry = 'Debes marcar un punto en el mapa'
  }

  return Object.keys(errors.value).length === 0
}

async function handleSubmit() {
  if (!validate()) return

  submitting.value = true
  try {
    const data = {
      type: form.value.type,
      title: form.value.title.trim(),
      description: form.value.description.trim() || null,
      start_datetime: new Date(form.value.start_datetime).toISOString(),
      end_datetime: form.value.end_datetime 
        ? new Date(form.value.end_datetime).toISOString() 
        : null
    }

    if (form.value.type === 'casa_a_casa') {
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
    } else {
      data.marker_lat = form.value.marker_lat
      data.marker_lng = form.value.marker_lng
    }

    await activitiesStore.createActivity(data)
    router.push({ name: 'activities-management' })
  } catch (error) {
    errors.value.submit = activitiesStore.error || 'Error al crear la actividad'
  } finally {
    submitting.value = false
  }
}

function handleGeometryChange(geometry) {
  if (form.value.type === 'casa_a_casa') {
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
  // Clear geometry error
  delete errors.value.geometry
}

// Reset geometry when type changes
watch(() => form.value.type, () => {
  form.value.polygon_geojson = null
  form.value.marker_lat = null
  form.value.marker_lng = null
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
        <h1 class="text-2xl font-bold">Crear Actividad</h1>
        <p class="text-base-content/60">Completa los datos de la nueva actividad</p>
      </div>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-6">
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

              <!-- Activity type -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-medium">Tipo de Actividad</span>
                </label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="casa_a_casa" 
                      v-model="form.type"
                      class="radio radio-primary"
                    />
                    <span>Casa a Casa</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="type" 
                      value="volanteo" 
                      v-model="form.type"
                      class="radio radio-secondary"
                    />
                    <span>Volanteo</span>
                  </label>
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
                  :min="today"
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
                  :min="form.start_datetime || today"
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
                  form.type === 'casa_a_casa' ? 'badge-primary' : 'badge-secondary'
                ]"
              >
                {{ form.type === 'casa_a_casa' ? 'Dibujar área' : 'Marcar punto' }}
              </span>
            </h2>

            <p class="text-sm text-base-content/60">
              {{ form.type === 'casa_a_casa' 
                ? 'Dibuja el polígono del área donde se realizará la actividad casa a casa.' 
                : 'Marca el punto de encuentro para el volanteo.' 
              }}
            </p>

            <div 
              class="h-[400px] lg:h-[500px] rounded-lg overflow-hidden border border-base-300 mt-2"
              :class="{ 'border-error': errors.geometry }"
            >
              <ActivityFormMap 
                :activity-type="form.type"
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
          {{ submitting ? 'Creando...' : 'Crear Actividad' }}
        </button>
      </div>
    </form>
  </div>
</template>
