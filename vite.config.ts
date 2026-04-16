import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  server: {
    host: process.env.TAURI_ENV_PLATFORM ? "127.0.0.1" : "::",
    port: 8080,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  build: {
    target: process.env.TAURI_ENV_PLATFORM ? "es2021" : "es2020",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": ["lucide-react", "@radix-ui/react-dialog", "@radix-ui/react-tooltip"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
