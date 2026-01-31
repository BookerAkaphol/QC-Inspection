import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl' // <--- 1. เพิ่มบรรทัดนี้

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // <--- 2. เพิ่มบรรทัดนี้
  ],
  server: {
    host: true
  }
})