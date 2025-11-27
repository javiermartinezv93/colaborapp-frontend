<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  },
  totalItems: {
    type: Number,
    default: 0
  },
  itemsPerPage: {
    type: Number,
    default: 10
  }
})

const emit = defineEmits(['page-change'])

const pages = computed(() => {
  const range = []
  const showPages = 5
  let start = Math.max(1, props.currentPage - Math.floor(showPages / 2))
  let end = Math.min(props.totalPages, start + showPages - 1)
  
  if (end - start + 1 < showPages) {
    start = Math.max(1, end - showPages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    range.push(i)
  }
  
  return range
})

const showingFrom = computed(() => {
  return Math.min((props.currentPage - 1) * props.itemsPerPage + 1, props.totalItems)
})

const showingTo = computed(() => {
  return Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
})

function goToPage(page) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex flex-col sm:flex-row items-center justify-between gap-4">
    <div class="text-sm text-gray-500">
      Mostrando {{ showingFrom }} - {{ showingTo }} de {{ totalItems }}
    </div>
    
    <div class="join">
      <button 
        class="join-item btn btn-sm"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
      >
        «
      </button>
      <button 
        class="join-item btn btn-sm"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
      >
        ‹
      </button>
      
      <button
        v-for="page in pages"
        :key="page"
        :class="[
          'join-item btn btn-sm',
          page === currentPage ? 'btn-active' : ''
        ]"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>
      
      <button 
        class="join-item btn btn-sm"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
      >
        ›
      </button>
      <button 
        class="join-item btn btn-sm"
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
      >
        »
      </button>
    </div>
  </div>
</template>
