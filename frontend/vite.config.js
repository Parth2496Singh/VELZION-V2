import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // --------------------------------------------------------
  // DEV SERVER CONFIGURATION (Ignored during EC2 production build)
  // --------------------------------------------------------
  server: {
    host: '0.0.0.0',       // Exposes server to the Docker host
    port: 5173,            // The port inside the container
    strictPort: true,      // Fail if port is in use, don't auto-switch
    watch: {
      usePolling: true,    // Crucial for Docker volume file-watching
    },
    hmr: {
      clientPort: 5173,    // CRITICAL FIX: Tells the browser websocket exactly where to connect
    }
  }
})