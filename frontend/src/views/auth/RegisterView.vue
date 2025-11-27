<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon, 
  PhoneIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const invitationToken = route.params.token
const invitation = ref(null)
const validating = ref(true)
const validationError = ref(null)

const form = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone_number: ''
})

const showPassword = ref(false)
const formError = ref(null)

onMounted(async () => {
  try {
    invitation.value = await authStore.validateInvitation(invitationToken)
    form.value.email = invitation.value.email
  } catch (error) {
    validationError.value = error.message
  } finally {
    validating.value = false
  }
})

async function handleSubmit() {
  formError.value = null

  if (form.value.password !== form.value.confirmPassword) {
    formError.value = 'Las contraseñas no coinciden'
    return
  }

  if (form.value.password.length < 8) {
    formError.value = 'La contraseña debe tener al menos 8 caracteres'
    return
  }

  const success = await authStore.register({
    token: invitationToken,
    username: form.value.username,
    email: form.value.email,
    password: form.value.password,
    phone_number: form.value.phone_number || null
  })

  if (!success) {
    formError.value = authStore.error
  }
}

function getRoleLabel(role) {
  const labels = {
    'administrador': 'Administrador',
    'coordinador': 'Coordinador',
    'voluntario': 'Voluntario'
  }
  return labels[role] || role
}
</script>

<template>
  <div>
    <!-- Validating -->
    <div v-if="validating" class="text-center py-8">
      <span class="loading loading-spinner loading-lg text-primary"></span>
      <p class="mt-4 text-base-content/60">Validando invitación...</p>
    </div>

    <!-- Validation error -->
    <div v-else-if="validationError" class="text-center py-8">
      <ExclamationCircleIcon class="w-16 h-16 mx-auto text-error" />
      <h3 class="text-xl font-semibold mt-4">Invitación Inválida</h3>
      <p class="text-base-content/60 mt-2">{{ validationError }}</p>
      <router-link to="/login" class="btn btn-primary mt-6">
        Ir al Login
      </router-link>
    </div>

    <!-- Registration form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-5">
      <div class="text-center">
        <h2 class="text-xl font-semibold">Crear Cuenta</h2>
        <p class="text-sm text-base-content/60 mt-1">
          Completa tu registro como 
          <span class="badge badge-sm badge-primary">{{ getRoleLabel(invitation.role_assigned) }}</span>
        </p>
      </div>

      <!-- Error alert -->
      <div v-if="formError" class="alert alert-error text-sm">
        <ExclamationCircleIcon class="w-5 h-5" />
        <span>{{ formError }}</span>
      </div>

      <!-- Username -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Nombre de usuario</span>
        </label>
        <label class="input input-bordered flex items-center gap-2">
          <UserIcon class="w-5 h-5 text-base-content/50" />
          <input 
            v-model="form.username"
            type="text" 
            placeholder="juanperez"
            class="grow"
            required
            minlength="3"
            maxlength="100"
          />
        </label>
      </div>

      <!-- Email (readonly from invitation) -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Correo electrónico</span>
        </label>
        <label class="input input-bordered flex items-center gap-2 bg-base-200">
          <EnvelopeIcon class="w-5 h-5 text-base-content/50" />
          <input 
            v-model="form.email"
            type="email" 
            class="grow"
            readonly
          />
          <CheckCircleIcon class="w-5 h-5 text-success" />
        </label>
        <label class="label">
          <span class="label-text-alt text-base-content/60">
            Email verificado por invitación
          </span>
        </label>
      </div>

      <!-- Phone -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Teléfono (opcional)</span>
        </label>
        <label class="input input-bordered flex items-center gap-2">
          <PhoneIcon class="w-5 h-5 text-base-content/50" />
          <input 
            v-model="form.phone_number"
            type="tel" 
            placeholder="+56 9 1234 5678"
            class="grow"
            maxlength="20"
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
            v-model="form.password"
            :type="showPassword ? 'text' : 'password'" 
            placeholder="Mínimo 8 caracteres"
            class="grow"
            required
            minlength="8"
          />
        </label>
      </div>

      <!-- Confirm Password -->
      <div class="form-control">
        <label class="label">
          <span class="label-text">Confirmar contraseña</span>
        </label>
        <label class="input input-bordered flex items-center gap-2">
          <LockClosedIcon class="w-5 h-5 text-base-content/50" />
          <input 
            v-model="form.confirmPassword"
            :type="showPassword ? 'text' : 'password'" 
            placeholder="Repite tu contraseña"
            class="grow"
            required
            minlength="8"
          />
        </label>
      </div>

      <!-- Show password toggle -->
      <label class="flex items-center gap-2 cursor-pointer">
        <input 
          type="checkbox" 
          class="checkbox checkbox-sm checkbox-primary"
          v-model="showPassword"
        />
        <span class="text-sm">Mostrar contraseñas</span>
      </label>

      <!-- Submit -->
      <button 
        type="submit" 
        class="btn btn-primary btn-block"
        :class="{ 'loading': authStore.loading }"
        :disabled="authStore.loading"
      >
        <span v-if="!authStore.loading">Crear Cuenta</span>
        <span v-else>Creando cuenta...</span>
      </button>

      <!-- Login link -->
      <p class="text-center text-sm text-base-content/60">
        ¿Ya tienes cuenta? 
        <router-link to="/login" class="link link-primary">Inicia sesión</router-link>
      </p>
    </form>
  </div>
</template>
