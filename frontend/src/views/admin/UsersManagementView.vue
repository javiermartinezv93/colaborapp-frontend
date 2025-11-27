<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUsersStore } from '@/stores/users'
import { useAuthStore } from '@/stores/auth'
import { UsersIcon, MagnifyingGlassIcon } from '@heroicons/vue/24/outline'
import dayjs from 'dayjs'

const usersStore = useUsersStore()
const authStore = useAuthStore()

const loading = computed(() => usersStore.loading)
const users = computed(() => usersStore.users)
const searchQuery = ref('')

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) return users.value
  
  const query = searchQuery.value.toLowerCase()
  return users.value.filter(user => 
    user.username.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  )
})

onMounted(() => {
  usersStore.fetchUsers()
})

function formatDate(dateStr) {
  return dayjs(dateStr).format('DD/MM/YYYY')
}

// Role options for the admin dropdown
const roleOptions = [
  { value: 'voluntario', label: 'Voluntario' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'administrador', label: 'Administrador' }
]

async function onRoleChange(user, newRole) {
  try {
    await usersStore.updateUser(user.id, { role: newRole })
  } catch (err) {
    // error handled in store (it sets usersStore.error) — optionally show a toast later
    console.error('Error updating role', err)
  }
}

async function onDeleteUser(user) {
  // Prevent deleting yourself
  if (authStore.user?.id === user.id) {
    alert('No puedes eliminar tu propia cuenta')
    return
  }

  if (!confirm(`¿Eliminar usuario ${user.username}? Esta acción no se puede deshacer.`)) return

  try {
    await usersStore.deleteUser(user.id)
  } catch (err) {
    console.error('Error deleting user', err)
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold flex items-center gap-2">
          <UsersIcon class="w-7 h-7 text-primary" />
          Gestión de Usuarios
        </h1>
        <p class="text-base-content/60 mt-1">
          Visualiza los usuarios registrados en el sistema
        </p>
      </div>
    </div>

    <!-- Search -->
    <div class="card bg-base-100 shadow">
      <div class="card-body py-4">
        <div class="flex items-center gap-4">
          <label class="input input-bordered flex items-center gap-2 flex-1 max-w-md">
            <MagnifyingGlassIcon class="w-5 h-5 text-base-content/50" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Buscar por nombre o email..."
              class="grow"
            />
          </label>
          <span class="text-sm text-base-content/60">
            {{ filteredUsers.length }} usuario{{ filteredUsers.length !== 1 ? 's' : '' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredUsers.length === 0" class="card bg-base-100 shadow">
      <div class="card-body text-center py-12">
        <UsersIcon class="w-16 h-16 mx-auto text-base-content/30" />
        <h3 class="text-lg font-medium mt-4">No hay usuarios</h3>
        <p class="text-base-content/60 mt-1">
          No se encontraron usuarios con los criterios de búsqueda
        </p>
      </div>
    </div>

    <!-- Users table -->
    <div v-else class="card bg-base-100 shadow">
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Rol</th>
                <th>Fecha de registro</th>
                <th v-if="authStore.isAdmin">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="hover">
                <td class="font-medium">{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td class="text-base-content/60">{{ user.phone_number || '-' }}</td>
                <td>
                  <span 
                    :class="[
                      'badge',
                      usersStore.getRoleColor(user.role) === 'error' ? 'badge-error' :
                      usersStore.getRoleColor(user.role) === 'warning' ? 'badge-warning' : 'badge-info'
                    ]"
                  >
                    {{ usersStore.getRoleLabel(user.role) }}
                  </span>
                </td>
                <td class="text-sm text-base-content/60">
                  {{ formatDate(user.created_at) }}
                </td>
                <td v-if="authStore.isAdmin" class="text-sm">
                  <div class="flex items-center gap-2">
                    <select
                      :value="user.role"
                      class="select select-sm"
                      @change="e => onRoleChange(user, e.target.value)"
                    >
                      <option v-for="opt in roleOptions" :key="opt.value" :value="opt.value">
                        {{ opt.label }}
                      </option>
                    </select>

                    <button
                      class="btn btn-sm btn-error"
                      @click="() => onDeleteUser(user)"
                      :disabled="user.id === authStore.user?.id"
                      title="Eliminar usuario"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
