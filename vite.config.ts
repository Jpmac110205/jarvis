import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: './backend',
  server: {
    port: 5173,
    proxy: {
      '/chat': 'http://localhost:8080',
      '/events': 'http://localhost:8080',
      '/tasks': 'http://localhost:8080',
      '/auth': 'http://localhost:8080',
      '/users': 'http://localhost:8080',
    }
  },
  build: {
    outDir: 'backend/dist',
    emptyOutDir: true
  },
})
