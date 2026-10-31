import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import process from "node:process";
import pkg from "./package.json" with { type: "json" };

const host = process.env.TAURI_DEV_HOST;
const port = Number(process.env.YORNA_PORT ?? 1420);

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },

  build: {
    chunkSizeWarningLimit: 1500,
  },

  // Tauri expects a fixed port and wants Rust errors left visible.
  clearScreen: false,
  server: {
    port,
    strictPort: true,
    host: host || process.env.YORNA_HOST || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: port + 1,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
