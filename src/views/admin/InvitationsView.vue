<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { 
  EnvelopeIcon, 
  PlusIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

const usersStore = useUsersStore()

const loading = computed(() => usersStore.loading)
const showModal = ref(false)
const copiedToken = ref(null)

const form = ref({
  email: '',
  role: 'voluntario'
})

const formError = ref(null)
const createdInvitation = ref(null)

const roleOptions = [
  { value: 'voluntario', label: 'Voluntario' },
  { value: 'coordinador', label: 'Coordinador' }
]

onMounted(async () => {
  // Fetch existing invitations when component mounts
  try {
    await usersStore.fetchInvitations()
  } catch (err) {
    console.error('Error loading invitations:', err)
  }
})

function openModal() {
  form.value = { email: '', role: 'voluntario' }
  formError.value = null
  createdInvitation.value = null
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function handleSubmit() {
  formError.value = null
  
  try {
    const invitation = await usersStore.createInvitation(
      form.value.email,
      form.value.role
    )
    createdInvitation.value = invitation
  } catch (error) {
    formError.value = usersStore.error || 'Error al crear la invitación'
  }
}

function getInvitationUrl(token) {
  return `${window.location.origin}/register/${token}`
}

async function copyToClipboard(token) {
  const url = getInvitationUrl(token)
  await navigator.clipboard.writeText(url)
  copiedToken.value = token
  setTimeout(() => {
    copiedToken.value = null
  }, 2000)
}

function getRoleLabel(role) {
  return roleOptions.find(r => r.value === role)?.label || role
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <EnvelopeIcon class="w-7 h-7 text-primary" />
          Invitaciones
        </h1>
        <p class="text-base-content/60 mt-1">
          Crea invitaciones para nuevos usuarios
        </p>
      </div>

      <button class="btn btn-primary gap-2" @click="openModal">
        <PlusIcon class="w-5 h-5" />
        Nueva Invitación
      </button>
    </div>

    <!-- Info card -->
    <div class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-lg">¿Cómo funcionan las invitaciones?</h2>
        <div class="space-y-3 text-base-content/70">
          <p>
            1. Crea una invitación especificando el email y rol del nuevo usuario.
          </p>
          <p>
            2. Se genera un enlace único que debes compartir con el invitado.
          </p>
          <p>
            3. El invitado usa ese enlace para completar su registro.
          </p>
          <p>
            4. Una vez usado, el enlace de invitación expira automáticamente.
          </p>
        </div>
      </div>
    </div>

    <!-- Recent invitations -->
    <div v-if="usersStore.invitations.length > 0" class="card bg-base-100 shadow">
      <div class="card-body">
        <h2 class="card-title text-lg">Invitaciones Recientes</h2>
        
        <div class="overflow-x-auto mt-2">
          <table class="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Enlace</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in usersStore.invitations" :key="inv.id">
                <td>{{ inv.email }}</td>
                <td>
                  <span 
                    :class="[
                      'badge badge-sm',
                      inv.role_assigned === 'coordinador' ? 'badge-warning' : 'badge-info'
                    ]"
                  >
                    {{ getRoleLabel(inv.role_assigned) }}
                  </span>
                </td>
                <td>
                  <span 
                    :class="[
                      'badge badge-sm',
                      inv.accepted ? 'badge-success' : 'badge-ghost'
                    ]"
                  >
                    {{ inv.accepted ? 'Aceptada' : 'Pendiente' }}
                  </span>
                </td>
                <td>
                  <button 
                    v-if="!inv.accepted"
                    class="btn btn-ghost btn-xs gap-1"
                    @click="copyToClipboard(inv.token)"
                  >
                    <component 
                      :is="copiedToken === inv.token ? CheckIcon : ClipboardDocumentIcon" 
                      class="w-4 h-4"
                    />
                    {{ copiedToken === inv.token ? 'Copiado' : 'Copiar enlace' }}
                  </button>
                  <span v-else class="text-sm text-base-content/60">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <dialog :class="['modal', { 'modal-open': showModal }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg">
          {{ createdInvitation ? 'Invitación Creada' : 'Nueva Invitación' }}
        </h3>

        <!-- Success view -->
        <div v-if="createdInvitation" class="mt-4 space-y-4">
          <div class="alert alert-success">
            <CheckIcon class="w-5 h-5" />
            <span>Invitación creada exitosamente</span>
          </div>

          <div class="space-y-2">
            <label class="label">
              <span class="label-text font-medium">Enlace de invitación:</span>
            </label>
            <div class="join w-full">
              <input 
                type="text"
                class="input input-bordered join-item flex-1 text-sm"
                :value="getInvitationUrl(createdInvitation.token)"
                readonly
              />
              <button 
                class="btn join-item gap-1"
                @click="copyToClipboard(createdInvitation.token)"
              >
                <component 
                  :is="copiedToken === createdInvitation.token ? CheckIcon : ClipboardDocumentIcon" 
                  class="w-4 h-4"
                />
                {{ copiedToken === createdInvitation.token ? 'Copiado' : 'Copiar' }}
              </button>
            </div>
            <p class="text-sm text-base-content/60">
              Comparte este enlace con <strong>{{ createdInvitation.email }}</strong> para que pueda registrarse como <strong>{{ getRoleLabel(createdInvitation.role_assigned) }}</strong>.
            </p>
          </div>

          <div class="modal-action">
            <button class="btn" @click="closeModal">Cerrar</button>
            <button class="btn btn-primary" @click="createdInvitation = null">
              Crear Otra
            </button>
          </div>
        </div>

        <!-- Form view -->
        <form v-else @submit.prevent="handleSubmit" class="mt-4 space-y-4">
          <div v-if="formError" class="alert alert-error">
            <ExclamationCircleIcon class="w-5 h-5" />
            <span>{{ formError }}</span>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Email del invitado</span>
            </label>
            <input 
              v-model="form.email"
              type="email"
              class="input input-bordered"
              placeholder="usuario@email.com"
              required
            />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Rol asignado</span>
            </label>
            <select v-model="form.role" class="select select-bordered">
              <option 
                v-for="option in roleOptions" 
                :key="option.value" 
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <label class="label">
              <span class="label-text-alt text-base-content/60">
                Los coordinadores pueden crear y gestionar actividades
              </span>
            </label>
          </div>

          <div class="modal-action">
            <button type="button" class="btn" @click="closeModal">
              Cancelar
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              :class="{ 'loading': loading }"
              :disabled="loading"
            >
              {{ loading ? 'Creando...' : 'Crear Invitación' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </dialog>
  </div>
</template>
