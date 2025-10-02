import { defineConfig } from 'vite'

import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-vite-plugin'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), TanStackRouterVite(), tailwindcss()],
  base: '/pac',
  server: {
    host: '0.0.0.0',
    port: 5173,
    origin: 'http://localhost:5173',
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '.ts.net'],
  },
})
