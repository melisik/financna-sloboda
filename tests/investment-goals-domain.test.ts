import { describe, expect, it } from "vitest";
import { goalProgress, groupByGoal } from "../src/domain/investments";
import type { InvestmentGoal, Position } from "../src/domain/model/entities";

const TS = "2026-10-01T10:00:00Z";
const pos = (id: string, goalId: string | undefined, qty: number): Position => ({
  id,
  name: id,
  kind: "fond",
  quantity: qty,
  unitPrice: 100,
  currency: "EUR",
  fxToEur: 1,
  valueDate: "2026-10-01",
  goalId,
  createdAt: TS,
  updatedAt: TS,
});
const goal = (id: string, targetCents: number): InvestmentGoal => ({ id, name: `Cieľ ${id}`, targetCents, createdAt: TS, updatedAt: TS });

describe("ciele investícií (D-105): skupiny", () => {
  it("položky sa zoskupia podľa cieľa, zvyšok ide do skupiny bez cieľa", () => {
    const positions = [pos("a", "g1", 2), pos("b", "g1", 1), pos("c", undefined, 3)];
    const groups = groupByGoal(positions, [goal("g1", 100_000), goal("g2", 50_000)]);
    expect(groups.map((g) => g.goal?.id ?? null)).toEqual(["g1", "g2", null]);
    expect(groups[0].positions.map((p) => p.id)).toEqual(["a", "b"]);
    expect(groups[0].totalCents).toBe(30_000);
    expect(groups[1].positions).toEqual([]);
    expect(groups[1].totalCents).toBe(0);
    expect(groups[2].positions.map((p) => p.id)).toEqual(["c"]);
    expect(groups[2].totalCents).toBe(30_000);
  });

  it("položka s cieľom, ktorý neexistuje, sa zobrazí v skupine bez cieľa", () => {
    const groups = groupByGoal([pos("a", "zmazany", 1)], [goal("g1", 100_000)]);
    expect(groups.find((g) => g.goal === null)?.positions.map((p) => p.id)).toEqual(["a"]);
  });

  it("bez skupiny bez cieľa sa takáto skupina nevytvorí", () => {
    const groups = groupByGoal([pos("a", "g1", 1)], [goal("g1", 100_000)]);
    expect(groups.some((g) => g.goal === null)).toBe(false);
  });
});

describe("ciele investícií (D-105): pokrok", () => {
  it("pod cieľom sa pokrok zobrazí ako percento, dosiahnutie nie je", () => {
    expect(goalProgress(25_000, 100_000)).toEqual({ percent: 25, reached: false });
  });

  it("nad cieľom alebo presne na cieli je cieľ dosiahnutý a percento je 100", () => {
    expect(goalProgress(100_000, 100_000)).toEqual({ percent: 100, reached: true });
    expect(goalProgress(150_000, 100_000)).toEqual({ percent: 100, reached: true });
  });

  it("bez hodnoty je pokrok nula, nikdy nie záporný", () => {
    expect(goalProgress(0, 100_000)).toEqual({ percent: 0, reached: false });
  });
});
