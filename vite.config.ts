import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// Relatívne cesty: funguje na GitHub Pages v podpriečinku /financna-sloboda/ aj lokálne.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Prijímaj pripojenia z lokálnej siete
    port: 5174,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),           // Finančná sloboda
        compaven: resolve(__dirname, "src/compaven.html"), // COMPAVEN 2.0
      },
      output: {
        // Oba bundles budú v dist/ s rôznymi názvami
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop().split(".")[0] : "chunk";
          return `chunks/[name]-[hash].js`;
        },
      },
    },
  },
});
