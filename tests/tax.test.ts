import { describe, expect, it } from "vitest";
import { TAX_CATALOG, taxScenario } from "../src/domain/tax";
import { validatePosition } from "../src/storage/validate";
import type { Position } from "../src/storage/types";

// Daňový rámec (FR-24, FR-25, D-104). Syntetické hodnoty. Sadzby nie sú overené, preto sa nepočíta po dani.
const base = { kind: "etf" as const, currency: "EUR", fxToEur: 1, valueDate: "2026-10-20", createdAt: "2026-10-20T10:00:00.000Z", updatedAt: "2026-10-20T10:00:00.000Z" };
const unset: Position = { ...base, id: "a", name: "bez režimu", quantity: 10, unitPrice: 100 };
const taxed: Position = { ...base, id: "b", name: "zdanené", quantity: 5, unitPrice: 200, taxRegime: "zdanene" };

describe("daňový rámec (FR-24, FR-25)", () => {
  it("položky bez režimu sú nezadané a hodnoty sa sčítajú podľa režimu", () => {
    const lines = taxScenario([unset, taxed]);
    expect(lines.find((l) => l.regime === "nezadane")?.valueCents).toBe(100_000);
    expect(lines.find((l) => l.regime === "zdanene")?.valueCents).toBe(100_000);
    expect(lines.find((l) => l.regime === "oslobodene")?.valueCents).toBe(0);
  });

  it("po dani zatiaľ nie je žiadne číslo (neoverené pravidlá)", () => {
    expect(taxScenario([taxed]).every((l) => l.afterTaxCents === null)).toBe(true);
    expect(Object.values(TAX_CATALOG).every((r) => r.rate === null && r.status === "neoverené")).toBe(true);
  });

  it("validácia odmietne režim mimo katalógu", () => {
    const errors = validatePosition({ ...taxed, taxRegime: "xyz" }, "2026-10-20", "položka");
    expect(errors.some((e) => e.includes("daňový režim"))).toBe(true);
    expect(validatePosition(taxed, "2026-10-20", "položka")).toEqual([]);
  });
});
