import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: './backend',
  server: {
    port: 5173,
    proxy: {
      '/upload':  { target: 'http://localhost:8080', changeOrigin: true },
      '/chat':    { target: 'http://localhost:8080', changeOrigin: true },
      '/auth':    { target: 'http://localhost:8080', changeOrigin: true },
      '/events':  { target: 'http://localhost:8080', changeOrigin: true },
      '/tasks':   { target: 'http://localhost:8080', changeOrigin: true },
      '/users':   { target: 'http://localhost:8080', changeOrigin: true },
      '/export':  { target: 'http://localhost:8080', changeOrigin: true },
    }
  },
  build: {
    outDir: 'backend/dist',
    emptyOutDir: true
  },
})
