import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  envDir: './backend',
  server: {
  port: 5173,
  proxy: {
    '^/$':      { target: 'http://localhost:8080', changeOrigin: true }, // exact "/" only
    '/upload':  { target: 'http://localhost:8080', changeOrigin: true },
    '/chat':    { target: 'http://localhost:8080', changeOrigin: true },
    '/auth':    { target: 'http://localhost:8080', changeOrigin: true },
    '/events':  { target: 'http://localhost:8080', changeOrigin: true },
    '/tasks':   { target: 'http://localhost:8080', changeOrigin: true },
    '/users':   { target: 'http://localhost:8080', changeOrigin: true },
    '/export':  { target: 'http://localhost:8080', changeOrigin: true },
    '/privacy': { target: 'http://localhost:8080', changeOrigin: true },
    // no '/app' entry — let Vite serve the live dev app here instead
  }
},
  build: {
    outDir: 'backend/dist',
    emptyOutDir: true
  },
})
