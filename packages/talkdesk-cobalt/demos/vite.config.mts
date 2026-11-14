import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  base: "./",
  esbuild: { jsx: "automatic" },
  resolve: {
    dedupe: [
      "react",
      "react-dom",
      "@talkdesk/cobalt-react-theme-provider",
      "@talkdesk/cobalt-react-viewport-provider",
      "@talkdesk/cobalt-react-portal-provider",
    ],
  },
  build: { outDir: "../site/public/demos", emptyOutDir: true },
});
