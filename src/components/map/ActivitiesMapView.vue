<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue'
import L from 'leaflet'

const props = defineProps({
  activities: {
    type: Array,
    default: () => []
  },
  showEditButton: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['activity-click'])

const mapContainer = ref(null)
let map = null
let layerGroup = null

// Default center (Chile)
const defaultCenter = [-33.4489, -70.6693]
const defaultZoom = 12

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (map) {
    map.remove()
    map = null
  }
})

watch(() => props.activities, () => {
  if (map) {
    updateLayers()
  }
}, { deep: true })

function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView(defaultCenter, defaultZoom)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map)

  layerGroup = L.layerGroup().addTo(map)

  updateLayers()
}

function updateLayers() {
  if (!map || !layerGroup) return

  // Clear existing layers
  layerGroup.clearLayers()

  const bounds = []

  props.activities.forEach(activity => {
    const { type, polygon_geojson, marker_lat, marker_lng, status, title } = activity

    // Get color based on status
    const colors = {
      'programada': '#3b82f6',
      'finalizada': '#22c55e',
      'cancelada': '#ef4444'
    }
    const color = colors[status] || '#3b82f6'

    if (type === 'casa_a_casa' && polygon_geojson) {
      // Draw polygon
      // Skip if polygon data is effectively empty
      let actualGeometry = polygon_geojson
      if (polygon_geojson.polygon) {
        actualGeometry = polygon_geojson.polygon
      }
      
      if (!actualGeometry || (actualGeometry.type !== 'Polygon' && actualGeometry.type !== 'MultiPolygon' && actualGeometry.type !== 'Feature')) {
        console.warn('Invalid polygon geometry for activity:', title, actualGeometry)
        // Skip rendering for invalid geometry
      } else {
        try {
          // Handle different possible formats:
          // 1. Geometry directly: { type: 'Polygon', coordinates: [...] }
          // 2. Feature: { type: 'Feature', geometry: {...}, properties: {...} }
          // 3. Custom object: { type: 'casa_a_casa', polygon: {...}, marker: null } (legacy)
          let geomData = actualGeometry

          // Ensure we have a valid GeoJSON object
          if (geomData.type === 'Polygon' || geomData.type === 'MultiPolygon') {
            geomData = {
              type: 'Feature',
              geometry: geomData,
              properties: {}
            }
          }

          const layer = L.geoJSON(geomData, {
            style: {
              color: color,
              weight: 2,
              opacity: 0.8,
              fillColor: color,
              fillOpacity: 0.2
            }
          })

          // Add label to polygon
          const bounds = layer.getBounds()
          const center = bounds.getCenter()
          const labelIcon = L.divIcon({
            className: 'activity-label',
            html: `<div style="background-color: rgba(0, 0, 0, 0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; pointer-events: none; font-weight: 500;">${activity.title}</div>`,
            iconSize: null
          })
          L.marker(center, { icon: labelIcon }).addTo(layerGroup)

          // Add popup
          layer.bindPopup(createPopup(activity))
          // Don't emit activity-click here - let user click the button in popup instead
          // layer.on('click', () => emit('activity-click', activity))

          layer.addTo(layerGroup)
          bounds.push(...layer.getBounds().toBBoxString().split(',').map(Number))
        } catch (e) {
          console.error('Error rendering polygon for activity', title, ':', e, 'polygon_geojson:', polygon_geojson)
        }
      }
    } else if (type === 'volanteo' && marker_lat && marker_lng) {
      // Draw marker with label
      const markerIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })

      const marker = L.marker([marker_lat, marker_lng], { icon: markerIcon })
      
      // Add label next to marker
      const labelIcon = L.divIcon({
        className: 'activity-label',
        html: `<div style="background-color: rgba(0, 0, 0, 0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; pointer-events: none; font-weight: 500; margin-left: 10px;">${activity.title}</div>`,
        iconSize: null
      })
      L.marker([marker_lat, marker_lng], { icon: labelIcon }).addTo(layerGroup)
      
      marker.bindPopup(createPopup(activity))
      // Don't emit activity-click here - let user click the button in popup instead
      // marker.on('click', () => emit('activity-click', activity))
      marker.addTo(layerGroup)

      bounds.push(marker_lat, marker_lng)
    }
  })

  // Fit all bounds if we have activities
  if (props.activities.length > 0 && bounds.length > 0) {
    try {
      const group = new L.FeatureGroup()
      layerGroup.eachLayer(layer => {
        if (layer.getBounds) {
          group.addLayer(layer)
        } else if (layer.getLatLng) {
          group.addLayer(layer)
        }
      })
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds(), { padding: [50, 50], maxZoom: 15 })
      }
    } catch (e) {
      // Fallback to default view
      map.setView(defaultCenter, defaultZoom)
    }
  }
}

function createPopup(activity) {
  const statusLabels = {
    'programada': 'Programada',
    'finalizada': 'Finalizada',
    'cancelada': 'Cancelada'
  }
  const typeLabels = {
    'casa_a_casa': 'Casa a Casa',
    'volanteo': 'Volanteo'
  }

  const startDate = new Date(activity.start_datetime).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

  const startTime = new Date(activity.start_datetime).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const endTime = activity.end_datetime ? new Date(activity.end_datetime).toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit'
  }) : 'No especificada'

  const statusColors = {
    'programada': 'bg-info text-info-content',
    'finalizada': 'bg-success text-success-content',
    'cancelada': 'bg-error text-error-content'
  }

  const typeColors = {
    'casa_a_casa': 'bg-primary text-primary-content',
    'volanteo': 'bg-secondary text-secondary-content'
  }

  return `
    <div style="min-width: 280px;">
      <div style="padding: 12px;">
        <h3 style="font-size: 16px; font-weight: bold; margin: 0 0 8px 0; color: #1f2937;">${activity.title}</h3>
        
        <div style="margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">
          <div style="display: flex; gap: 6px; margin-bottom: 6px;">
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #dbeafe; color: #1e40af;">${typeLabels[activity.type]}</span>
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; background: #${activity.status === 'programada' ? 'dbeafe; color: #1e40af' : activity.status === 'finalizada' ? 'dcfce7; color: #166534' : 'fee2e2; color: #991b1b'};">${statusLabels[activity.status]}</span>
          </div>
        </div>

        <div style="margin-bottom: 10px; font-size: 13px;">
          <div style="margin-bottom: 6px;">
            <strong style="color: #374151;">📅 Fecha:</strong> 
            <span style="color: #6b7280;">${startDate}</span>
          </div>
          <div style="margin-bottom: 6px;">
            <strong style="color: #374151;">⏰ Horario:</strong> 
            <span style="color: #6b7280;">${startTime}${activity.end_datetime ? ' - ' + endTime : ''}</span>
          </div>
          ${activity.description ? `<div style="margin-bottom: 6px;">
            <strong style="color: #374151;">📝 Descripción:</strong> 
            <span style="color: #6b7280; display: block; font-size: 12px; margin-top: 2px;">${activity.description}</span>
          </div>` : ''}
          <div>
            <strong style="color: #374151;">👤 Encargado:</strong> 
            <span style="color: #6b7280;">${activity.creator?.username || 'N/A'}</span>
          </div>
        </div>

        <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e5e7eb;">
          <a href="/actividades/${activity.id}" style="display: inline-block; padding: 6px 12px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer;">Ver Detalles</a>
        </div>
      </div>
    </div>
  `
}
</script>

<template>
  <div ref="mapContainer" class="w-full h-full"></div>
</template>

<style scoped>
.custom-marker {
  background: transparent;
  border: none;
}
</style>
