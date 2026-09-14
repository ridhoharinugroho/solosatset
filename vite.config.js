import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
        tokoSaya: resolve(import.meta.dirname, "toko-saya.html"),
        notFound: resolve(import.meta.dirname, "404.html"),
      },
    },
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
});
