import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: "/",
  plugins: [react()],
  envDir: "./backend",
  // Development API calls go through this server's proxy.
  define:
    command === "serve"
      ? { "import.meta.env.VITE_BACKEND_URL": JSON.stringify("") }
      : {},
  server: {
    port: 8000,
    strictPort: true,
    proxy: {
      "^/$": { target: "http://localhost:8080", changeOrigin: true }, // exact "/" only
      "/upload": { target: "http://localhost:8080", changeOrigin: true },
      "/chat": { target: "http://localhost:8080", changeOrigin: true },
      "/auth": { target: "http://localhost:8080", changeOrigin: true },
      "/events": { target: "http://localhost:8080", changeOrigin: true },
      "/tasks": { target: "http://localhost:8080", changeOrigin: true },
      "/users": { target: "http://localhost:8080", changeOrigin: true },
      "/export": { target: "http://localhost:8080", changeOrigin: true },
      "/privacy": { target: "http://localhost:8080", changeOrigin: true },
      "/health": { target: "http://localhost:8080", changeOrigin: true },
      "/config": { target: "http://localhost:8080", changeOrigin: true },
      "/conversation": { target: "http://localhost:8080", changeOrigin: true },
      "/documents": { target: "http://localhost:8080", changeOrigin: true },
      "/memory": { target: "http://localhost:8080", changeOrigin: true },
      "/static": { target: "http://localhost:8080", changeOrigin: true },
      // no '/app' entry — let Vite serve the live dev app here instead
    },
  },
  build: {
    outDir: "backend/dist",
    emptyOutDir: true,
  },
}));
