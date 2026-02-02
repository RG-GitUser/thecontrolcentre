import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use /controlcentre/ when the host won't let you set subdomain doc root (serve from main domain subdir)
const basePath = typeof process.env.VITE_BASE_PATH !== 'undefined'
  ? process.env.VITE_BASE_PATH
  : './'

export default defineConfig({
  base: basePath,
  plugins: [react()],
})
