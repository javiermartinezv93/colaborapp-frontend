<script setup>
import { computed } from 'vue'

const props = defineProps({
  status: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'status',
    validator: (value) => ['status', 'activity', 'attendance', 'role'].includes(value)
  },
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value)
  }
})

const statusConfig = {
  // Activity status
  programada: { label: 'Programada', class: 'badge-info' },
  finalizada: { label: 'Finalizada', class: 'badge-success' },
  cancelada: { label: 'Cancelada', class: 'badge-error' },
  
  // Activity type
  casa_a_casa: { label: 'Casa a Casa', class: 'badge-primary' },
  volanteo: { label: 'Volanteo', class: 'badge-secondary' },
  
  // Attendance status
  asistira: { label: 'Asistirá', class: 'badge-success' },
  quizas_asistira: { label: 'Quizás', class: 'badge-warning' },
  no_asistira: { label: 'No asistirá', class: 'badge-error' },
  
  // User roles
  administrador: { label: 'Administrador', class: 'badge-primary' },
  coordinador: { label: 'Coordinador', class: 'badge-secondary' },
  voluntario: { label: 'Voluntario', class: 'badge-ghost' }
}

const sizeClasses = {
  sm: 'badge-sm',
  md: '',
  lg: 'badge-lg'
}

const config = computed(() => {
  return statusConfig[props.status] || { label: props.status, class: 'badge-ghost' }
})

const badgeClass = computed(() => {
  return ['badge', config.value.class, sizeClasses[props.size]]
})
</script>

<template>
  <span :class="badgeClass">
    {{ config.label }}
  </span>
</template>
