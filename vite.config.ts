import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      port: 7162,
      strictPort: true,
      proxy: {
        "/api": {
          target: process.env.NODE_ENV === "production" ? "https://recrutment-backend-avanish.onrender.com" : "http://127.0.0.1:8787",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 7162,
      strictPort: true,
    },
  },
});
