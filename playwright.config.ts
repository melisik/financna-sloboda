import { defineConfig, devices } from "@playwright/test";

// Zostava s Fázou 2 pre testy (D-125). Nastavuje sa tu, nie v príkaze, aby config fungoval aj na Windows (audit, nález 13).
process.env.VITE_PHASE2 = "1";

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: "**/*.spec.ts",
  use: { baseURL: "http://localhost:4173", trace: "off" },
  webServer: {
    // Testy používajú zostavu s Fázou 2 do dist-test; dist (verejná zostava) ostáva bez Fázy 2 (D-125).
    command: "npx vite build --outDir dist-test && npx vite preview --outDir dist-test --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } },
  ],
});
