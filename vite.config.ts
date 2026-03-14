import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'; // <--- IMPORTANTE

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/Matriz-QFD/',
    plugins: [
      react(),
      tailwindcss(), // <--- IMPORTANTE
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || ''),
    },
    // Añadimos esto para asegurar que el CSS se extraiga correctamente
    css: {
      postcss: './postcss.config.js', 
    }
  };
});
