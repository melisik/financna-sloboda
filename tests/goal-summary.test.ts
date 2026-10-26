import { describe, expect, it } from "vitest";
import { goalSummaries } from "../src/domain/investments";
import type { InvestmentGoal, Position } from "../src/storage/types";

// D-331: pokrok cieľov investícií na Prehľade a priradenie položiek pri tvorbe cieľa. Syntetické hodnoty.
const pos = (id: string, value: number, goalId?: string): Position => ({ id, name: id, kind: "etf", quantity: 1, unitPrice: value, currency: "EUR", fxToEur: 1, valueDate: "2026-10-01", ...(goalId ? { goalId } : {}), createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" });
const goal = (id: string, name: string, target: number): InvestmentGoal => ({ id, name, targetCents: target * 100, createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" });

describe("goalSummaries (D-331)", () => {
  it("pre každý cieľ vráti súčet, cieľ, percento a či je dosiahnutý; bez cieľa nič", () => {
    const r = goalSummaries([pos("a", 400, "g1"), pos("b", 200, "g1"), pos("c", 900, "g2"), pos("d", 50)], [goal("g1", "Dôchodok", 2000), goal("g2", "Auto", 800)]);
    expect(r).toEqual([
      { id: "g1", name: "Dôchodok", totalCents: 60000, targetCents: 200000, percent: 30, reached: false, count: 2 },
      { id: "g2", name: "Auto", totalCents: 90000, targetCents: 80000, percent: 100, reached: true, count: 1 },
    ]);
  });
  it("prázdny cieľ má 0 % a 0 položiek; bez cieľov prázdny zoznam", () => {
    expect(goalSummaries([], [goal("g1", "Rezerva", 1000)])).toEqual([{ id: "g1", name: "Rezerva", totalCents: 0, targetCents: 100000, percent: 0, reached: false, count: 0 }]);
    expect(goalSummaries([pos("a", 10)], [])).toEqual([]);
  });
});
