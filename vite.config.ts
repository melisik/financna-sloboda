import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export const COMPAVEN_CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; " +
  "connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'";

// Len pri builde: v dev režime plugin React vkladá inline preambulu, ktorú by script-src 'self' zablokoval.
function compavenCsp(): Plugin {
  return {
    name: "compaven-csp",
    apply: "build",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!ctx.filename.endsWith("compaven.html")) return html;
        return {
          html,
          tags: [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: COMPAVEN_CSP }, injectTo: "head-prepend" }],
        };
      },
    },
  };
}

// --mode real|sandbox určí VITE_COMPAVEN_ENV; odporujúca premenná zo shellu build zastaví.
function applyCompavenMode(mode: string): void {
  if (mode !== "real" && mode !== "sandbox") return;
  const fromShell = process.env.VITE_COMPAVEN_ENV;
  if (fromShell && fromShell !== mode) {
    throw new Error(`VITE_COMPAVEN_ENV=${fromShell} v prostredí odporuje režimu --mode ${mode}.`);
  }
  process.env.VITE_COMPAVEN_ENV = mode;
}

// Relatívne cesty: funguje na GitHub Pages v podpriečinku /financna-sloboda/ aj lokálne.
export default defineConfig(({ mode }) => {
  applyCompavenMode(mode);
  return {
  base: "./",
  plugins: [react(), compavenCsp()],
  server: {
    host: "0.0.0.0", // Prijímaj pripojenia z lokálnej siete
    port: 5174,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),              // Finančná sloboda
        compaven: resolve(__dirname, "src/compaven.html"),   // COMPAVEN 2.0 (produkčná aj testovacia cez ?test=true)
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
  };
});
