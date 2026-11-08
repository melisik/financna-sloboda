import React from "react";
import { createRoot } from "react-dom/client";
import { CompavenApp } from "./compaven-ui/App";
import { ErrorBoundary } from "./ui/ErrorBoundary";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./compaven-sw.js").catch(() => {
      /* bez SW aplikácia funguje online; chyba registrácie sa neoznamuje */
    });
  });
}

// Detekcia testovacieho režimu z query parametru
const urlParams = new URLSearchParams(window.location.search);
const testMode = urlParams.get("test") === "true";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CompavenApp testMode={testMode} />
    </ErrorBoundary>
  </React.StrictMode>,
);
