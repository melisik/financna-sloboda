import "fake-indexeddb/auto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openRepository, TEST_DB_PREFIX } from "../src/storage/indexeddb";

// F-09: izolované testové DB nesmú oslabiť kontrolu názvu DB mimo Vitest.

afterEach(() => {
  vi.unstubAllEnvs();
});

const isolated = () => `${TEST_DB_PREFIX}isolation-${Math.random().toString(36).slice(2)}`;

describe("F-09: izolácia testových databáz", () => {
  it("v režime test povolí názov s predponou vitest-", async () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "sandbox");
    await expect(openRepository(isolated())).resolves.toBeDefined();
  });

  it("v režime test odmietne neznámy názov bez predpony", async () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "sandbox");
    await expect(openRepository("random-unknown-database")).rejects.toThrow(/Database name mismatch/);
  });

  it("názvy REAL odmietne aj v režime test, aj s predponou", async () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "sandbox");
    await expect(openRepository("compaven-2.0-real")).rejects.toThrow(/Database name mismatch/);
    await expect(openRepository(`${TEST_DB_PREFIX}compaven-2.0-real`)).rejects.toThrow(/Database name mismatch/);
    await expect(openRepository(`${TEST_DB_PREFIX}x-compaven-2.0-real-backups`)).rejects.toThrow(/Database name mismatch/);
  });

  it("mimo režimu test (produkcia) odmietne aj názov s predponou", async () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "sandbox");
    vi.stubEnv("MODE", "production");
    await expect(openRepository(isolated())).rejects.toThrow(/Database name mismatch/);
  });

  it("v produkčnom režime REAL buildu odmietne sandbox aj testový názov", async () => {
    vi.stubEnv("VITE_COMPAVEN_ENV", "real");
    vi.stubEnv("MODE", "production");
    await expect(openRepository("compaven-2.0-sandbox")).rejects.toThrow(/Database name mismatch/);
    await expect(openRepository(isolated())).rejects.toThrow(/Database name mismatch/);
  });
});
