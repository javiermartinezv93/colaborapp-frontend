<script setup>
defineProps({
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  text: {
    type: String,
    default: ''
  }
})

const sizeClasses = {
  xs: 'loading-xs',
  sm: 'loading-sm',
  md: 'loading-md',
  lg: 'loading-lg',
  xl: 'loading-xl'
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-2 py-8">
    <span :class="['loading loading-spinner text-primary', sizeClasses[size]]"></span>
    <span v-if="text" class="text-gray-500 text-sm">{{ text }}</span>
  </div>
</template>
