<script setup>
import { CalendarIcon } from '@heroicons/vue/24/outline'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-primary/10 via-base-200 to-secondary/10 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mb-4">
          <CalendarIcon class="w-8 h-8 text-primary-content" />
        </div>
        <h1 class="text-2xl font-bold text-base-content">Sistema de Actividades</h1>
        <p class="text-base-content/60 mt-1">Gestión de actividades y voluntarios</p>
      </div>

      <!-- Content slot -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <slot />
        </div>
      </div>

      <!-- Footer -->
      <p class="text-center text-sm text-base-content/50 mt-6">
        © {{ new Date().getFullYear() }} Sistema de Actividades
      </p>
    </div>
  </div>
</template>
