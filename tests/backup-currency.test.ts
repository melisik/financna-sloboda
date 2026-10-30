import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseBackup } from "../src/storage/backup";

const TODAY = "2026-10-29";

function loadBackup() {
  return JSON.parse(
    readFileSync(path.resolve("public/testovacia-zaloha.json"), "utf8"),
  );
}

describe("D-340: kompatibilita menových polí v zálohách", () => {
  it("importuje staršiu zálohu v16 bez menových polí transakcie", () => {
    const backup = loadBackup();
    backup.schemaVersion = 16;

    for (const transaction of backup.transactions) {
      delete transaction.currency;
      delete transaction.exchangeRateToBase;
      delete transaction.originalAmountCents;
    }

    const result = parseBackup(backup, TODAY);
    expect(result.ok).toBe(true);
  });

  it("importuje zálohu v17 s menovými údajmi transakcie", () => {
    const backup = loadBackup();
    backup.schemaVersion = 17;

    backup.transactions[0] = {
      ...backup.transactions[0],
      currency: "USD",
      exchangeRateToBase: 1.08,
      originalAmountCents: 10_000,
    };

    const result = parseBackup(backup, TODAY);
    expect(result.ok, result.ok ? "" : result.errors.join("; ")).toBe(true);
  });

  it("importuje zálohu v17 s baseCurrency a savedExchangeRates v nastaveniach", () => {
    const backup = loadBackup();
    backup.schemaVersion = 17;
    backup.settings = {
      ...backup.settings,
      baseCurrency: "EUR",
      savedExchangeRates: { USD: 1.08 },
    };

    const result = parseBackup(backup, TODAY);
    expect(result.ok, result.ok ? "" : result.errors.join("; ")).toBe(true);
  });

  it("odmieta zálohu s neplatným kurzom v savedExchangeRates", () => {
    const backup = loadBackup();
    backup.schemaVersion = 17;
    backup.settings = {
      ...backup.settings,
      savedExchangeRates: { USD: -5 },
    };

    const result = parseBackup(backup, TODAY);
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors.join("; ")).toContain("savedExchangeRates");
  });
});
