<script setup>
defineProps({
  title: {
    type: String,
    default: 'Confirmar'
  },
  message: {
    type: String,
    required: true
  },
  confirmText: {
    type: String,
    default: 'Confirmar'
  },
  cancelText: {
    type: String,
    default: 'Cancelar'
  },
  confirmClass: {
    type: String,
    default: 'btn-primary'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['confirm', 'cancel'])

function confirm() {
  emit('confirm')
}

function cancel() {
  emit('cancel')
}
</script>

<template>
  <div class="modal modal-open">
    <div class="modal-box max-w-sm">
      <h3 class="font-bold text-lg mb-4">{{ title }}</h3>
      <p class="text-gray-600">{{ message }}</p>

      <div class="modal-action">
        <button 
          class="btn" 
          :disabled="loading"
          @click="cancel"
        >
          {{ cancelText }}
        </button>
        <button 
          :class="['btn', confirmClass]"
          :disabled="loading"
          @click="confirm"
        >
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          {{ confirmText }}
        </button>
      </div>
    </div>
    <div class="modal-backdrop bg-black/50" @click="cancel"></div>
  </div>
</template>
