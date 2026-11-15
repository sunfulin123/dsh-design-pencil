import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  base: "./",
  plugins: [react()],
  resolve: { dedupe: ["react", "react-dom"] },
  esbuild: { jsx: "automatic" },
  // Keep static handoff while loading charts only for routes that import them.
  build: {
    outDir: "delivery",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:echarts|zrender)\//.test(id))
            return "charts";
          if (
            /node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(?:react|react-dom|scheduler)\//.test(
              id,
            )
          )
            return "react";
        },
      },
    },
  },
});
