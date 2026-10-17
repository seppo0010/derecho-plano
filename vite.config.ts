import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/derecho-plano/',
  plugins: [react()],
  build: {
    outDir: 'build',
  },
});
