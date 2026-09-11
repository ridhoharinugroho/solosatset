import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        admin: resolve(import.meta.dirname, "admin.html"),
        tokoSaya: resolve(import.meta.dirname, "toko-saya.html"),
        pembayaranQris: resolve(import.meta.dirname, "pembayaran-qris.html"),
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
