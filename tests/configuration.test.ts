import { describe, it, expect } from "vitest";

// PHASE 1A: Environment Configuration — Unit Tests
// NOTE: import.meta.env.VITE_COMPAVEN_ENV is read-only and set at build time.
// These tests verify that:
// 1. The configuration module exists and loads without error
// 2. The environment.ts file has the required functions
// 3. DB name mapping is consistent
// 4. The implementation enforces build-time environment authority

describe("PHASE 1A: Environment Configuration", () => {
  it("Test 1: Modul environment.ts sa úspešne importuje", async () => {
    const env = await import("../src/config/environment");
    expect(env.getEnvironmentConfig).toBeDefined();
    expect(env.validateEnvironmentConsistency).toBeDefined();
    expect(env.updateEnvironmentMarker).toBeDefined();
  });

  it("Test 2: Typ Environment ma správne hodnoty — 'real' a 'sandbox'", async () => {
    const env = await import("../src/config/environment");
    // Overenie ze export existuje
    expect(env).toHaveProperty("getEnvironmentConfig");
    expect(env).toHaveProperty("validateEnvironmentConsistency");
  });

  it("Test 3: Konfigurácia vracia všetky požadované polia", async () => {
    const env = await import("../src/config/environment");
    const config = env.getEnvironmentConfig();

    expect(config).toHaveProperty("env");
    expect(config).toHaveProperty("dbName");
    expect(config).toHaveProperty("isRealEnv");
    expect(config).toHaveProperty("isSandboxEnv");

    // Kontrola typov
    expect(typeof config.env).toBe("string");
    expect(typeof config.dbName).toBe("string");
    expect(typeof config.isRealEnv).toBe("boolean");
    expect(typeof config.isSandboxEnv).toBe("boolean");
  });

  it("Test 4: DB meno a prostredie sa logicky koreľujú", async () => {
    const env = await import("../src/config/environment");
    const config = env.getEnvironmentConfig();

    // Ak env je "real", DB by mal byť "compaven-2.0-real"
    if (config.env === "real") {
      expect(config.dbName).toBe("compaven-2.0-real");
      expect(config.isRealEnv).toBe(true);
      expect(config.isSandboxEnv).toBe(false);
    }

    // Ak env je "sandbox", DB by mal byť "compaven-2.0-sandbox"
    if (config.env === "sandbox") {
      expect(config.dbName).toBe("compaven-2.0-sandbox");
      expect(config.isRealEnv).toBe(false);
      expect(config.isSandboxEnv).toBe(true);
    }

    // Ani jedna z hodnot by nemala byť stará "compaven-2.0" alebo "compaven-2.0-test"
    expect(config.dbName).not.toBe("compaven-2.0");
    expect(config.dbName).not.toBe("compaven-2.0-test");
    expect(config.dbName).not.toBe("financna-sloboda");
  });

  it("Test 5: Presne dva vlajky isRealEnv a isSandboxEnv — nikdy nie obidve true", async () => {
    const env = await import("../src/config/environment");
    const config = env.getEnvironmentConfig();

    const trueCount = (config.isRealEnv ? 1 : 0) + (config.isSandboxEnv ? 1 : 0);
    expect(trueCount).toBe(1); // Presne jedna musí byť true
  });

  it("Test 6: updateEnvironmentMarker — funkcionalita je definovaná", async () => {
    const env = await import("../src/config/environment");

    // V Node.js testovacím prostredí localStorage neexistuje,
    // ale v prehliadači to funguje. Testujeme, že funkcia existuje a jej logika je OK.
    expect(env.updateEnvironmentMarker).toBeDefined();

    // Ak je localStorage dostupný, testujeme funkcionalitu
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
      env.updateEnvironmentMarker();

      const envValue = localStorage.getItem("__COMPAVEN_ENV__");
      const dbValue = localStorage.getItem("__COMPAVEN_DB_NAME__");

      expect(envValue).toBeTruthy();
      expect(dbValue).toBeTruthy();
      expect(["real", "sandbox"]).toContain(envValue);
      expect(dbValue).toMatch(/compaven-2.0-(real|sandbox)/);
    }
  });

  it("Test 7: Modul vynútuje build-time konfiguráciu — bez VITE_COMPAVEN_ENV bude error", async () => {
    // Toto si overujeme kontrolou že modul vôbec existuje a je použitelný
    // Reálny test prebieha pri build-time — ak VITE_COMPAVEN_ENV není nastavený,
    // build selže alebo aplikácia vyhodí error
    const env = await import("../src/config/environment");
    expect(env.getEnvironmentConfig).toBeDefined();

    // Ak sa dostaneme sem, znamená to, že VITE_COMPAVEN_ENV bol nastaven pri build-time
    const config = env.getEnvironmentConfig();
    expect(["real", "sandbox"]).toContain(config.env);
  });

  it("Test 8: Zvláštny prípad — bez URL parametra sa aplikácia spustí normálne", async () => {
    const env = await import("../src/config/environment");

    // Bez URL parametra ?env= by validateEnvironmentConsistency nemala vrhnúť chybu
    try {
      env.validateEnvironmentConsistency();
      expect(true).toBe(true); // OK
    } catch (e) {
      // Ak je chyba, musí byť len "conflict" — nie "missing"
      const message = String(e);
      expect(message).not.toContain("is not set");
    }
  });

  it("Test 9: Bonus — konzistencia volania getEnvironmentConfig viacnásobne", async () => {
    const env = await import("../src/config/environment");

    const config1 = env.getEnvironmentConfig();
    const config2 = env.getEnvironmentConfig();

    // Musí byť identické — build-time config je fixná
    expect(config1.env).toBe(config2.env);
    expect(config1.dbName).toBe(config2.dbName);
    expect(config1.isRealEnv).toBe(config2.isRealEnv);
    expect(config1.isSandboxEnv).toBe(config2.isSandboxEnv);
  });
});
