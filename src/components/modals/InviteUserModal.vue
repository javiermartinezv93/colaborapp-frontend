<script setup>
import { ref } from 'vue'
import { useUsersStore } from '@/stores/users'

const emit = defineEmits(['close', 'invited'])

const usersStore = useUsersStore()

const form = ref({
  email: '',
  role: 'voluntario'
})

const loading = ref(false)
const error = ref('')
const success = ref(false)
const invitationLink = ref('')

const roles = [
  { value: 'voluntario', label: 'Voluntario', description: 'Puede ver actividades y confirmar asistencia' },
  { value: 'coordinador', label: 'Coordinador', description: 'Puede crear y gestionar sus propias actividades' },
  { value: 'administrador', label: 'Administrador', description: 'Acceso completo al sistema' }
]

async function submitInvite() {
  if (!form.value.email) {
    error.value = 'El correo electrónico es requerido'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await usersStore.createInvitation({
      email: form.value.email,
      role: form.value.role
    })
    
    success.value = true
    invitationLink.value = `${window.location.origin}/register?token=${response.token}`
    emit('invited', response)
  } catch (err) {
    error.value = err.response?.data?.detail || 'Error al crear la invitación'
  } finally {
    loading.value = false
  }
}

function copyLink() {
  navigator.clipboard.writeText(invitationLink.value)
}

function close() {
  emit('close')
}

function inviteAnother() {
  success.value = false
  invitationLink.value = ''
  form.value.email = ''
}
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box">
      <button 
        class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        @click="close"
      >
        ✕
      </button>

      <h3 class="font-bold text-lg mb-4">Invitar Usuario</h3>

      <!-- Success state -->
      <div v-if="success" class="space-y-4">
        <div class="alert alert-success">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>¡Invitación creada exitosamente!</span>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Enlace de invitación</span>
          </label>
          <div class="join w-full">
            <input 
              type="text" 
              :value="invitationLink" 
              readonly
              class="input input-bordered join-item flex-1 text-sm"
            />
            <button class="btn btn-primary join-item" @click="copyLink">
              Copiar
            </button>
          </div>
          <label class="label">
            <span class="label-text-alt text-gray-500">
              Comparte este enlace con el usuario invitado
            </span>
          </label>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="inviteAnother">
            Invitar otro
          </button>
          <button class="btn btn-primary" @click="close">
            Listo
          </button>
        </div>
      </div>

      <!-- Form state -->
      <form v-else @submit.prevent="submitInvite" class="space-y-4">
        <div v-if="error" class="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ error }}</span>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Correo electrónico</span>
          </label>
          <input 
            type="email" 
            v-model="form.email"
            placeholder="usuario@ejemplo.com"
            class="input input-bordered"
            required
          />
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Rol</span>
          </label>
          <div class="space-y-2">
            <label 
              v-for="role in roles" 
              :key="role.value"
              class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-base-200 transition-colors"
              :class="form.role === role.value ? 'border-primary bg-primary/5' : 'border-base-300'"
            >
              <input 
                type="radio" 
                :value="role.value" 
                v-model="form.role"
                class="radio radio-primary mt-1"
              />
              <div>
                <div class="font-medium">{{ role.label }}</div>
                <div class="text-sm text-gray-500">{{ role.description }}</div>
              </div>
            </label>
          </div>
        </div>

        <div class="modal-action">
          <button type="button" class="btn" @click="close">
            Cancelar
          </button>
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="loading"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            Enviar Invitación
          </button>
        </div>
      </form>
    </div>
    <div class="modal-backdrop bg-black/50" @click="close"></div>
  </div>
</template>
