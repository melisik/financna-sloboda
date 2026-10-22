import { describe, expect, it } from "vitest";
import { expenseTotalsByCategory, filterHistory, totalsByType } from "../src/domain/history";
import { recommendedReserveCents, recommendedSettings } from "../src/domain/recommendations";
import type { Transaction } from "../src/storage/types";

const tx = (id: string, date: string, type: Transaction["type"], amountCents: number): Transaction => ({
  id, date, type, amountCents, createdAt: `${date}T10:00:00Z`, updatedAt: `${date}T10:00:00Z`,
  ...(type === "vydavok" ? { source: "z_prijmu" as const } : {}),
});
const sample = [
  tx("a", "2026-09-01", "sporenie", 10_000),
  tx("b", "2026-10-02", "vydavok", 5_000),
  tx("c", "2026-10-05", "sporenie", 20_000),
];

describe("história (FR-15)", () => {
  it("zoradí od najnovšej", () => {
    expect(filterHistory(sample, {}).map((t) => t.id)).toEqual(["c", "b", "a"]);
  });

  it("filter podľa typu", () => {
    expect(filterHistory(sample, { type: "sporenie" }).map((t) => t.id)).toEqual(["c", "a"]);
  });

  it("filter podľa obdobia je vrátane krajných dátumov", () => {
    expect(filterHistory(sample, { from: "2026-10-02", to: "2026-10-05" }).map((t) => t.id)).toEqual(["c", "b"]);
  });

  it("súčty za obdobie podľa typu", () => {
    const period = filterHistory(sample, { from: "2026-10-01" });
    expect(totalsByType(period)).toEqual({ vydavok: 5_000, sporenie: 20_000 });
  });
});

describe("východiskové hodnoty (FR-13, D-061)", () => {
  it("rezerva sú 3 mesiace výdavkov: 24 000 € → 6 000 €", () => {
    expect(recommendedReserveCents(2_400_000)).toBe(600_000);
  });

  it("východiskové hodnoty podľa D-043, D-048, D-049, D-050", () => {
    const s = recommendedSettings(2_400_000);
    expect(s.withdrawalRate).toBe(0.037);
    expect(s.realReturn).toBe(0.035);
    expect(s.thresholdCents).toBe(10_000);
    expect(s.reserveCents).toBe(600_000);
  });
});

describe("filter a súčty podľa kategórie", () => {
  const base = { amountCents: 1000, createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T10:00:00Z", date: "2026-10-01", source: "z_hotovosti" as const };
  const food: Transaction = { ...base, id: "f", type: "vydavok", category: "jedlo", amountCents: 4500 };
  const transport: Transaction = { ...base, id: "d", type: "vydavok", category: "doprava", amountCents: 1200 };
  const unassigned: Transaction = { ...base, id: "n", type: "vydavok", amountCents: 300 };
  const saving: Transaction = { ...base, id: "s", type: "sporenie", source: undefined, amountCents: 50000 };
  const all = [food, transport, unassigned, saving];

  it("filter kategórie vyberie len danú kategóriu, nezaradené je samostatná voľba", () => {
    expect(filterHistory(all, { category: "jedlo" }).map((t) => t.id)).toEqual(["f"]);
    expect(filterHistory(all, { category: "none" }).map((t) => t.id).sort()).toEqual(["n", "s"]);
    expect(filterHistory(all, {}).length).toBe(4);
  });

  it("súčty výdavkov podľa kategórie; sporenie sa neráta a bez kategórie je nezaradené", () => {
    expect(expenseTotalsByCategory(all)).toEqual({ jedlo: 4500, doprava: 1200, "nezaradené": 300 });
    expect(expenseTotalsByCategory([saving])).toEqual({});
  });
});

