import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";

// Read the backend port from the file
const backendPortFile = path.resolve(__dirname, "backend-port.txt");
let backendPort: string | number = 3000;
if (fs.existsSync(backendPortFile)) {
  backendPort = fs.readFileSync(backendPortFile, "utf-8").trim();
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      "/convert-to-openapi": {
        target: `http://localhost:${backendPort}`,
        changeOrigin: true,
        rewrite: (path) =>
          path.replace(/^\/convert-to-openapi/, "/convert-to-openapi"),
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
