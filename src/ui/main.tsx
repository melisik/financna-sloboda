import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// Offline režim (M5): service worker len v produkčnom builde.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* bez SW aplikácia funguje online; chyba registrácie sa neoznamuje */
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
