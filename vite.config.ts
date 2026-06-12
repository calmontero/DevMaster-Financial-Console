import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    // Esto obliga a Vite a usar SIEMPRE una única copia de React, evitando pantallas en blanco
    dedupe: ['react', 'react-dom'],
  },
})