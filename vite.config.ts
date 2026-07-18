import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { vitePrerenderPlugin } from 'vite-prerender-plugin';

export default defineConfig({
  plugins: [
    react(),
    // Writes dist/<route>/index.html with real content for the public routes
    // (src/prerender.tsx). Vercel serves those files before the SPA rewrite;
    // unknown paths still fall back to index.html.
    vitePrerenderPlugin({
      renderTarget: '#root',
      prerenderScript: fileURLToPath(new URL('./src/prerender.tsx', import.meta.url)),
      additionalPrerenderRoutes: ['/collection', '/builder'],
    }),
  ],
  // Honor the PORT assigned by the launch harness (autoPort); fall back to Vite's default.
  server: { port: Number(process.env.PORT) || 5173 },
});
