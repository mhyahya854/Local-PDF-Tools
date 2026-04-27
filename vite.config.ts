import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

function resolveManualChunk(id: string): string | undefined {
  if (!id.includes("node_modules")) {
    return undefined;
  }

  if (
    id.includes("react-router-dom") ||
    /[\\/]react-dom[\\/]/.test(id) ||
    /[\\/]react[\\/]/.test(id) ||
    id.includes("scheduler")
  ) {
    return "react-vendor";
  }

  if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) {
    return "query-vendor";
  }

  if (
    id.includes("react-hook-form") ||
    id.includes("@hookform/resolvers") ||
    /[\\/]zod[\\/]/.test(id)
  ) {
    return "form-vendor";
  }

  if (id.includes("@radix-ui")) {
    return "ui-vendor";
  }

  if (id.includes("recharts")) {
    return "charts-vendor";
  }

  return undefined;
}

export default defineConfig(() => ({
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
    cors: false,
    allowedHosts: ["127.0.0.1", "localhost"],
    fs: {
      strict: true,
      allow: [path.resolve(__dirname)],
    },
    hmr: {
      overlay: false,
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  build: {
    target: process.env.TAURI_ENV_PLATFORM ? "es2021" : "es2020",
    rollupOptions: {
      output: {
        manualChunks: resolveManualChunk,
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
