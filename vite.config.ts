import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // ¡Indispensable para que se vea bien!

export default defineConfig({
  base: '/Matriz-QFD/',
  plugins: [
    react(),
    tailwindcss(), // ¡Indispensable para que se vea bien!
  ],
  // Hemos eliminado toda la parte de la IA (define y loadEnv)
  css: {
    postcss: './postcss.config.js', 
  }
});
