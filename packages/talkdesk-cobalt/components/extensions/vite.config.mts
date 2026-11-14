/** Build a reusable component library; applications own React and Cobalt installation. */
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
    },
    rollupOptions: {
      external: (id) =>
        id === 'react' ||
        id.startsWith('react/') ||
        id === 'react-dom' ||
        id.startsWith('react-dom/') ||
        id.startsWith('@talkdesk/'),
    },
  },
});
