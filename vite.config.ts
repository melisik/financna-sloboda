import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relatívne cesty: funguje na GitHub Pages v podpriečinku /financna-sloboda/ aj lokálne.
export default defineConfig({
  base: "./",
  plugins: [react()],
});
