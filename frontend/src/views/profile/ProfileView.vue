<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, UserIcon } from '@heroicons/vue/24/outline'
import api from '@/services/api'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)
const loading = ref(false)
const editing = ref(false)
const error = ref(null)
const success = ref(false)
const phoneError = ref(null)

const formData = ref({
  username: '',
  email: '',
  phone_number: ''
})

onMounted(() => {
  if (!user.value) {
    router.push('/login')
  } else {
    formData.value = {
      username: user.value.username || '',
      email: user.value.email || '',
      phone_number: user.value.phone_number || ''
    }
  }
})

async function handleSubmit() {
  error.value = null
  success.value = false
  phoneError.value = null
  loading.value = true

  try {
    // Validate phone format if provided
    const phone = formData.value.phone_number?.trim()
    const phoneRegex = /^\+56\s?9\s?\d{4}\s?\d{4}$/
    if (phone && !phoneRegex.test(phone)) {
      phoneError.value = 'Formato de teléfono inválido. Use +56 9 1234 5678'
      loading.value = false
      return
    }

    const response = await api.put('/users/me', formData.value)
    
    // Update auth store with new user data
    authStore.user = response.data
    
    success.value = true
    editing.value = false
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      success.value = false
    }, 3000)
  } catch (err) {
    error.value = err.response?.data?.detail || 'Error al actualizar perfil'
    console.error('Error updating profile:', err)
  } finally {
    loading.value = false
  }
}

function cancelEdit() {
  formData.value = {
    username: user.value.username || '',
    email: user.value.email || '',
    phone_number: user.value.phone_number || ''
  }
  editing.value = false
  error.value = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <router-link to="/" class="btn btn-ghost btn-circle">
        <ArrowLeftIcon class="w-5 h-5" />
      </router-link>
      <div>
        <h1 class="text-2xl font-bold">Mi Perfil</h1>
        <p class="text-base-content/60 mt-1">Administra tu información personal</p>
      </div>
    </div>

    <!-- Profile Card -->
    <div class="card bg-base-100 shadow-lg">
      <div class="card-body">
        <!-- Success Message -->
        <div v-if="success" class="alert alert-success">
          <span>✓ Perfil actualizado correctamente</span>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-error">
          <span>✗ {{ error }}</span>
        </div>

        <!-- Profile Content -->
        <div v-if="!editing">
          <!-- View Mode -->
          <div class="space-y-6">
            <!-- User Avatar Section -->
            <div class="flex items-center gap-4 pb-6 border-b border-base-200">
              <div class="avatar placeholder">
                <div class="bg-primary text-primary-content rounded-full w-16">
                  <span class="text-2xl font-bold">
                    {{ user?.username?.charAt(0).toUpperCase() || 'U' }}
                  </span>
                </div>
              </div>
              <div>
                <h2 class="text-xl font-bold">{{ user?.username }}</h2>
                <p class="text-base-content/60 text-sm capitalize">{{ user?.role }}</p>
              </div>
            </div>

            <!-- User Info -->
            <div class="space-y-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold flex items-center gap-2">
                    <UserIcon class="w-4 h-4" />
                    Nombre de Usuario
                  </span>
                </label>
                <p class="text-lg text-base-content">{{ user?.username }}</p>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold flex items-center gap-2">
                    <EnvelopeIcon class="w-4 h-4" />
                    Correo Electrónico
                  </span>
                </label>
                <p class="text-lg text-base-content">{{ user?.email }}</p>
              </div>

              <div class="form-control">
                <label class="label">
                  <span class="label-text font-semibold flex items-center gap-2">
                    <PhoneIcon class="w-4 h-4" />
                    Teléfono
                  </span>
                </label>
                <p class="text-lg text-base-content">
                  {{ user?.phone_number || 'No especificado' }}
                </p>
              </div>
            </div>

            <!-- Action Button -->
            <div class="card-actions justify-end pt-6 border-t border-base-200">
              <button
                class="btn btn-primary"
                @click="editing = true"
              >
                Editar Perfil
              </button>
            </div>
          </div>
        </div>

        <!-- Edit Mode -->
        <form v-else @submit.prevent="handleSubmit" class="space-y-6">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Nombre de Usuario</span>
            </label>
            <input
              v-model="formData.username"
              type="text"
              placeholder="Tu nombre de usuario"
              class="input input-bordered input-sm"
              required
              minlength="3"
              maxlength="100"
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Correo Electrónico</span>
            </label>
            <input
              v-model="formData.email"
              type="email"
              placeholder="tu@email.com"
              class="input input-bordered input-sm"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Teléfono (Opcional)</span>
            </label>
            <input
              v-model="formData.phone_number"
              type="tel"
              placeholder="+56 9 1234 5678"
              class="input input-bordered input-sm"
              maxlength="20"
            />
              <p v-if="phoneError" class="text-xs text-error mt-1">{{ phoneError }}</p>
          </div>

          <!-- Form Actions -->
          <div class="card-actions justify-end gap-2 pt-6 border-t border-base-200">
            <button
              type="button"
              class="btn btn-ghost"
              @click="cancelEdit"
              :disabled="loading"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="loading"
              :class="{ 'loading': loading }"
            >
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Additional Info -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h3 class="card-title text-sm">Información de Cuenta</h3>
        <div class="divider my-0"></div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-base-content/60">Rol:</span>
            <span class="font-semibold capitalize">{{ user?.role }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-base-content/60">Miembro desde:</span>
            <span class="font-semibold">
              {{ user?.created_at ? new Date(user.created_at).toLocaleDateString('es-CL') : 'N/A' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
