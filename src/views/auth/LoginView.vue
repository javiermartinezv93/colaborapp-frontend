<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { EnvelopeIcon, LockClosedIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

async function handleSubmit() {
  await authStore.login(email.value, password.value)
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="text-center">
      <h2 class="text-xl font-semibold">Iniciar Sesión</h2>
      <p class="text-sm text-base-content/60 mt-1">Ingresa tus credenciales para continuar</p>
    </div>

    <!-- Error alert -->
    <div v-if="authStore.error" class="alert alert-error">
      <ExclamationCircleIcon class="w-5 h-5" />
      <span>{{ authStore.error }}</span>
    </div>

    <!-- Email -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">Correo electrónico</span>
      </label>
      <label class="input input-bordered flex items-center gap-2">
        <EnvelopeIcon class="w-5 h-5 text-base-content/50" />
        <input 
          v-model="email"
          type="email" 
          placeholder="tu@email.com"
          class="grow"
          required
          autocomplete="email"
        />
      </label>
    </div>

    <!-- Password -->
    <div class="form-control">
      <label class="label">
        <span class="label-text">Contraseña</span>
      </label>
      <label class="input input-bordered flex items-center gap-2">
        <LockClosedIcon class="w-5 h-5 text-base-content/50" />
        <input 
          v-model="password"
          :type="showPassword ? 'text' : 'password'" 
          placeholder="••••••••"
          class="grow"
          required
          minlength="8"
          autocomplete="current-password"
        />
        <button 
          type="button"
          class="btn btn-ghost btn-xs"
          @click="showPassword = !showPassword"
        >
          {{ showPassword ? 'Ocultar' : 'Mostrar' }}
        </button>
      </label>
    </div>

    <!-- Submit -->
    <button 
      type="submit" 
      class="btn btn-primary btn-block"
      :class="{ 'loading': authStore.loading }"
      :disabled="authStore.loading"
    >
      <span v-if="!authStore.loading">Iniciar Sesión</span>
      <span v-else>Ingresando...</span>
    </button>

    <!-- Info -->
    <p class="text-center text-sm text-base-content/60">
      ¿No tienes cuenta? Solicita una invitación a un administrador.
    </p>
  </form>
</template>
