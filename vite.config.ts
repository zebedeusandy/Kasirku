import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "0.0.0.0",
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    strictPort: false,
    hmr: false,
  },
  preview: {
    host: "0.0.0.0",
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
  },
});
