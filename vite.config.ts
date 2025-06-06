import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

// Read the backend port from the file
const backendPort : string = "3000"; // Default port

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      "/api/convert-to-openapi": {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/convert-to-openapi/, "/convert-to-openapi"),
      },
      "/api/process-openapi": {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/process-openapi/, "/process-openapi"),
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
