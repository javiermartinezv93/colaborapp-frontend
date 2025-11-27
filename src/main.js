import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize auth check after pinia is ready
const authStore = (await import('@/stores/auth')).useAuthStore()
authStore.initializeAuth()

app.mount('#app')
