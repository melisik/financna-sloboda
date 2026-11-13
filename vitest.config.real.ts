import { defineConfig } from "vitest/config";

// Konfigurácia pre REAL security testy — Windows-kompatibilná alternatíva k UNIX env prefixu.
// Použitie: vitest run --config vitest.config.real.ts <test-file>
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    env: { VITE_COMPAVEN_ENV: "real" },
  },
});
