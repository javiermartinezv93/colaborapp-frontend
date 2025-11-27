<script setup>
import { ref, onMounted, watch, onUnmounted, computed } from 'vue'
import L from 'leaflet'
import 'leaflet-draw'
import 'leaflet-draw/dist/leaflet.draw.css'

const props = defineProps({
  activityType: {
    type: String,
    required: true,
    validator: (value) => ['casa_a_casa', 'volanteo'].includes(value)
  },
  initialPolygon: {
    type: Object,
    default: null
  },
  initialMarker: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['geometry-change'])

const mapContainer = ref(null)
let map = null
let drawnItems = null
let drawControl = null

// Default center (Chile)
const defaultCenter = [-33.4489, -70.6693]
const defaultZoom = 13

const isPolygonMode = computed(() => props.activityType === 'casa_a_casa')

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch(() => props.activityType, () => {
  if (map) {
    updateDrawControl()
    // Clear existing drawings when type changes
    drawnItems.clearLayers()
    emitGeometry()
  }
})

function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView(defaultCenter, defaultZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  // Initialize feature group
  drawnItems = new L.FeatureGroup()
  map.addLayer(drawnItems)

  // Add initial geometry if provided
  if (props.initialPolygon && props.activityType === 'casa_a_casa') {
    try {
      const layer = L.geoJSON(props.initialPolygon)
      layer.eachLayer(l => drawnItems.addLayer(l))
      map.fitBounds(drawnItems.getBounds(), { padding: [50, 50] })
    } catch (e) {
      console.error('Error loading initial polygon:', e)
    }
  } else if (props.initialMarker && props.activityType === 'volanteo') {
    const { lat, lng } = props.initialMarker
    if (lat && lng) {
      const marker = L.marker([lat, lng])
      drawnItems.addLayer(marker)
      map.setView([lat, lng], 15)
    }
  }

  // Initialize draw control
  updateDrawControl()

  // Handle draw events
  map.on(L.Draw.Event.CREATED, (e) => {
    drawnItems.clearLayers()
    drawnItems.addLayer(e.layer)
    emitGeometry()
  })

  map.on(L.Draw.Event.EDITED, () => {
    emitGeometry()
  })

  map.on(L.Draw.Event.DELETED, () => {
    emitGeometry()
  })
}

function updateDrawControl() {
  // Remove existing control if any
  if (drawControl) {
    map.removeControl(drawControl)
  }

  const drawOptions = {
    position: 'topright',
    draw: {
      polyline: false,
      circle: false,
      circlemarker: false,
      rectangle: false,
      polygon: isPolygonMode.value ? {
        allowIntersection: true,  // Allow edge intersection to prevent 3-point limit
        showArea: true,
        metric: true,
        drawError: {
          color: '#e74c3c',
          message: '<strong>Error:</strong> Los bordes no pueden cruzarse'
        },
        shapeOptions: {
          color: '#3b82f6',
          weight: 2,
          fillOpacity: 0.2
        }
      } : false,
      marker: !isPolygonMode.value
    },
    edit: {
      featureGroup: drawnItems,
      remove: true
    }
  }

  drawControl = new L.Control.Draw(drawOptions)
  map.addControl(drawControl)
}

function emitGeometry() {
  if (drawnItems.getLayers().length === 0) {
    emit('geometry-change', { type: props.activityType, polygon: null, marker: null })
    return
  }

  const layer = drawnItems.getLayers()[0]

  if (isPolygonMode.value) {
    // Polygon mode - get GeoJSON
    const geojson = layer.toGeoJSON()
    emit('geometry-change', { 
      type: 'casa_a_casa', 
      polygon: geojson.geometry,
      marker: null
    })
  } else {
    // Marker mode - get lat/lng
    const latLng = layer.getLatLng()
    emit('geometry-change', { 
      type: 'volanteo',
      polygon: null,
      marker: { lat: latLng.lat, lng: latLng.lng }
    })
  }
}

// Method to clear all drawings
function clearDrawing() {
  drawnItems.clearLayers()
  emitGeometry()
}

// Expose method to parent
defineExpose({ clearDrawing })
</script>

<template>
  <div class="relative">
    <div ref="mapContainer" class="w-full h-[400px] rounded-lg"></div>
    <div class="absolute bottom-4 left-4 z-[1000] bg-white/90 px-3 py-2 rounded-lg shadow-md">
      <div v-if="isPolygonMode" class="flex items-center gap-2 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
        <span>Dibuja un polígono para el área de la actividad</span>
      </div>
      <div v-else class="flex items-center gap-2 text-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Coloca un marcador en la ubicación de la actividad</span>
      </div>
    </div>
  </div>
</template>

<style>
/* Leaflet Draw custom styles */
.leaflet-draw-toolbar a {
  background-color: white !important;
}

.leaflet-draw-actions a {
  background-color: #3b82f6 !important;
  color: white !important;
}

.leaflet-draw-section {
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
</style>
