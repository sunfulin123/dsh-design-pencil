import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  resolve: { dedupe: ['react', 'react-dom'] },
  esbuild: { jsx: 'automatic' },
  // The HTML POC handoff serves static built HTML, never uncompiled TSX.
  build: { outDir: 'delivery' },
});
