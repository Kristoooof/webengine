import { defineConfig } from "vite";

// Relatív base: ugyanaz a build megy GitHub Pages-re (/webengine/) és a Tauri appba is.
export default defineConfig({
  base: "./",
  clearScreen: false,
  server: { port: 5173, strictPort: true },
  build: { target: "es2022", outDir: "dist", chunkSizeWarningLimit: 1500 },
});
