import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: './backend',  // Add this line - tells Vite to look for .env in backend folder
  build: {
    outDir: 'backend/dist',
    emptyOutDir: true
  }
})