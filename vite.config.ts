import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Honor the PORT assigned by the launch harness (autoPort); fall back to Vite's default.
  server: { port: Number(process.env.PORT) || 5173 },
});
