import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://lajaraneta.cl:9090',
        changeOrigin: true
      }
    }
  },
  optimizeDeps: {
    include: ['@vuepic/vue-datepicker']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          datepicker: ['@vuepic/vue-datepicker']
        }
      }
    }
  }
})
