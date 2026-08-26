import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// Where `npm run dev` forwards /api. Override with DEV_API_PROXY_TARGET to point
// the dev server at a local backend instead:
//   DEV_API_PROXY_TARGET=http://localhost:8000 npm run dev
const DEV_API_TARGET = process.env.DEV_API_PROXY_TARGET ?? "https://appbe.odos.market";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  server: {
    proxy: {
      // Node makes this request, not the browser, so the backend's CORS rules
      // never come into it. `changeOrigin` rewrites the Host header, which the
      // TLS vhost on the far end needs to route correctly.
      "/api": {
        target: DEV_API_TARGET,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
