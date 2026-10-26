import { describe, expect, it } from "vitest";
import { validatePosition } from "../src/storage/validate";
import { SCHEMA_VERSION, READABLE_SCHEMA_VERSIONS } from "../src/storage/types";

// D-329, docs/63 oddiel 5: poskytovateľ investície je nepovinný; schéma zálohy v15.
const base = { id: "p1", name: "Syntetický ETF", kind: "etf", quantity: 2, unitPrice: 10, currency: "EUR", fxToEur: 1, valueDate: "2026-10-01", createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" };

describe("poskytovateľ pri položke investície (D-329)", () => {
  it("schéma zálohy je 15 a staršie sa čítajú", () => {
    expect(SCHEMA_VERSION).toBe(16);
    expect(READABLE_SCHEMA_VERSIONS).toContain(14);
    expect(READABLE_SCHEMA_VERSIONS).toContain(15);
  });
  it("bez poskytovateľa je v poriadku", () => {
    expect(validatePosition(base, "2026-10-26")).toEqual([]);
  });
  it("poskytovateľ zo zoznamu (IČO a názov) aj vlastný (len názov) prejde", () => {
    expect(validatePosition({ ...base, provider: { ico: "31340890", name: "365.bank, a. s." } }, "2026-10-26")).toEqual([]);
    expect(validatePosition({ ...base, provider: { name: "Trading 212" } }, "2026-10-26")).toEqual([]);
  });
  it("odmietne prázdny alebo príliš dlhý názov, zlé IČO a neznáme polia", () => {
    expect(validatePosition({ ...base, provider: { name: "  " } }, "2026-10-26").join()).toMatch(/poskytovateľ/);
    expect(validatePosition({ ...base, provider: { name: "x".repeat(121) } }, "2026-10-26").join()).toMatch(/poskytovateľ/);
    expect(validatePosition({ ...base, provider: { ico: "12", name: "A" } }, "2026-10-26").join()).toMatch(/IČO/);
    expect(validatePosition({ ...base, provider: { name: "A", address: "x" } }, "2026-10-26").join()).toMatch(/poskytovateľ/);
    expect(validatePosition({ ...base, provider: "Trading 212" }, "2026-10-26").join()).toMatch(/poskytovateľ/);
  });
});

import { buildBackup, parseBackup } from "../src/storage/backup";
import type { AppData } from "../src/storage/types";
describe("záloha zachová poskytovateľa (D-329)", () => {
  it("export a import round trip", () => {
    const data: AppData = { settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [{ ...base, kind: "etf", provider: { ico: "31340890", name: "365.bank, a. s." } } as never], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], dogs: [], stockItems: [], recipes: [], goals: [], wasteRecords: [], shoppingItems: [] };
    const parsed = parseBackup(JSON.parse(JSON.stringify(buildBackup(data, "2026-10-26T10:00:00Z"))), "2026-10-26");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data?.investments[0].provider).toEqual({ ico: "31340890", name: "365.bank, a. s." });
  });
});
