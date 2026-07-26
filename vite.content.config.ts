import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "dist",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, "src/content/scanner.ts"),
      output: {
        format: "iife",
        entryFileNames: "entries/content.js"
      }
    }
  }
});
