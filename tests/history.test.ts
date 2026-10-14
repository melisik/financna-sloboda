import { describe, expect, it } from "vitest";
import { filterHistory, totalsByType } from "../src/app/history";
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
