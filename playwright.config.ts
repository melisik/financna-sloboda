import { defineConfig, devices } from "@playwright/test";
import { writeCameraFixture } from "./tests/e2e/camera-fixture";

// Zostava s Fázou 2 pre testy (D-125). Nastavuje sa tu, nie v príkaze, aby config fungoval aj na Windows (audit, nález 13).
process.env.VITE_PHASE2 = "1";

// Falošná kamera prehliadača číta syntetický EAN-13 zo súboru Y4M (skenovanie kamerou, D-233).
const cameraArgs = [
  "--use-fake-ui-for-media-stream",
  "--use-fake-device-for-media-stream",
  `--use-file-for-fake-video-capture=${writeCameraFixture("test-results/ean13-camera.y4m", "4006381333931")}`,
];

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
    { name: "desktop", use: { ...devices["Desktop Chrome"], launchOptions: { executablePath: "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: cameraArgs } } },
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, launchOptions: { executablePath: "/opt/pw-browsers/chromium-1243/chrome-linux64/chrome", args: cameraArgs } } },
  ],
});
