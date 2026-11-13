import React from "react";
import { createRoot } from "react-dom/client";
import { CompavenApp } from "./compaven-ui/App";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { validateEnvironmentConsistency, updateEnvironmentMarker } from "./config/environment";
import { renderFatalError } from "./compaven-ui/renderFatalError";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./compaven-sw.js").catch(() => {
      /* bez SW aplikácia funguje online; chyba registrácie sa neoznamuje */
    });
  });
}

// PHASE 1A: Validácia prostredia — jediný autoritatívny zdroj je VITE_COMPAVEN_ENV (build-time)
try {
  validateEnvironmentConsistency();
  updateEnvironmentMarker();
} catch (error) {
  // Zobrazí sa chyba — aplikácia sa nespustí
  const message = error instanceof Error ? error.message : String(error);
  renderFatalError(document.getElementById("root")!, message);
  throw error;
}

// NOTE: testMode sa nahrádza centrálnou konfiguráciou.
// CompavenApp prijímá `isSandboxMode` (odvodené z VITE_COMPAVEN_ENV).
const isSandboxMode = import.meta.env.VITE_COMPAVEN_ENV === "sandbox";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <CompavenApp isSandboxMode={isSandboxMode} />
    </ErrorBoundary>
  </React.StrictMode>,
);
