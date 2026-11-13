import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Testy bežia v sandboxe, ak prostredie nie je zadané explicitne (npm test, CI).
    env: { VITE_COMPAVEN_ENV: process.env.VITE_COMPAVEN_ENV ?? "sandbox" },
  },
});
