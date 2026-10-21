import { describe, expect, it } from "vitest";
import { investmentsByKindCents, positionsChangedSince } from "../src/domain/investments";
import type { Position } from "../src/storage/types";

// Investície: rozpis podľa druhu a upozornenie na zmenu po vyhodnotení. Syntetické hodnoty.
const base: Position = { id: "a", name: "ETF test", kind: "etf", quantity: 10, unitPrice: 20, currency: "EUR", fxToEur: 1, valueDate: "2026-10-01", taxRegime: "nezadane", createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T10:00:00Z" };

describe("investície", () => {
  it("rozpis hodnoty podľa druhu položky", () => {
    const positions: Position[] = [base, { ...base, id: "b", kind: "treti_pilier", quantity: 1, unitPrice: 500 }, { ...base, id: "c", kind: "etf", quantity: 5, unitPrice: 20 }];
    expect(investmentsByKindCents(positions)).toEqual({ etf: 30000, treti_pilier: 50000 });
  });

  it("zmena položky po vyhodnotení sa oznámi, pred vyhodnotením nie", () => {
    expect(positionsChangedSince([base], "2026-10-01T09:00:00Z")).toBe(true);
    expect(positionsChangedSince([base], "2026-10-01T11:00:00Z")).toBe(false);
    expect(positionsChangedSince([], "2026-10-01T09:00:00Z")).toBe(false);
  });
});
