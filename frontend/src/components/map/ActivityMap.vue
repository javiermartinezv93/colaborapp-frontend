<script setup>
import { ref, onMounted, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
  activity: {
    type: Object,
    required: true
  },
  readonly: {
    type: Boolean,
    default: true
  }
})

const mapContainer = ref(null)
let map = null
let layer = null

// Default center (Temuco, Chile)
const defaultCenter = [-38.7359, -72.5904]
const defaultZoom = 13

onMounted(() => {
  initMap()
})

watch(() => props.activity, () => {
  if (map) {
    updateMap()
  }
}, { deep: true })

function initMap() {
  if (!mapContainer.value) return

  map = L.map(mapContainer.value).setView(defaultCenter, defaultZoom)

  // Capas base
  const streets = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  })

  const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  })

  // Capas de superposición
  const transportation = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri'
  })

  const places = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Esri'
  })

  // Mapas base disponibles
  const baseMaps = {
    "Calles": streets,
    "Satelital": satellite
  }

  // Capas de superposición
  const overlays = {
    "Calles": transportation,
    "Lugares": places
  }

  // Agregar capa satelital por defecto
  satellite.addTo(map)

  // Agregar superposiciones por defecto
  transportation.addTo(map)
  places.addTo(map)

  // Control de capas
  L.control.layers(baseMaps, overlays).addTo(map)

  updateMap()
}

function updateMap() {
  if (!map || !props.activity) return

  // Remove existing layer
  if (layer) {
    map.removeLayer(layer)
    layer = null
  }

  const { type, polygon_geojson, marker_lat, marker_lng, status } = props.activity

  // Get color based on status
  const colors = {
    'programada': '#3b82f6',
    'finalizada': '#22c55e',
    'cancelada': '#ef4444'
  }
  const color = colors[status] || '#3b82f6'

  if (type === 'casa_a_casa' && polygon_geojson) {
    // Draw polygon
    try {
      // Handle different possible formats
      let geomData = polygon_geojson

      // If it's the custom format, extract the polygon
      if (polygon_geojson.polygon && polygon_geojson.type === 'casa_a_casa') {
        geomData = polygon_geojson.polygon
      }

      // Ensure we have a valid GeoJSON object
      if (geomData.type === 'Polygon' || geomData.type === 'MultiPolygon') {
        geomData = {
          type: 'Feature',
          geometry: geomData,
          properties: {}
        }
      }

      layer = L.geoJSON(geomData, {
        style: {
          color: color,
          weight: 3,
          opacity: 0.8,
          fillColor: color,
          fillOpacity: 0.3
        }
      }).addTo(map)

      // Add popup
      layer.bindPopup(createPopup(props.activity))

      // Add label to polygon
      const bounds = layer.getBounds()
      const center = bounds.getCenter()
      const labelIcon = L.divIcon({
        className: 'activity-label',
        html: `<div style="background-color: rgba(0, 0, 0, 0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; pointer-events: none; font-weight: 500;">${props.activity.title}</div>`,
        iconSize: null
      })
      L.marker(center, { icon: labelIcon }).addTo(map)

      // Fit bounds
      map.fitBounds(layer.getBounds(), { padding: [50, 50] })
    } catch (e) {
      console.error('Error rendering polygon:', e, 'polygon_geojson:', polygon_geojson)
      // Fallback to default view
      map.setView(defaultCenter, defaultZoom)
    }
  } else if (type === 'volanteo' && marker_lat && marker_lng) {
    // Draw marker with label
    const markerIcon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    })

    const marker = L.marker([marker_lat, marker_lng], { icon: markerIcon }).addTo(map)

    // Add popup
    marker.bindPopup(createPopup(props.activity))

    // Add label next to marker
    const labelIcon = L.divIcon({
      className: 'activity-label',
      html: `<div style="background-color: rgba(0, 0, 0, 0.7); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; white-space: nowrap; pointer-events: none; font-weight: 500; margin-left: 10px;">${props.activity.title}</div>`,
      iconSize: null
    })
    L.marker([marker_lat, marker_lng], { icon: labelIcon }).addTo(map)

    map.setView([marker_lat, marker_lng], 15)
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
