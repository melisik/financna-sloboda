import { describe, expect, it } from "vitest";
import { monthsToTarget, targetDate } from "../src/domain/goal";

const eur = (x: number) => x * 100;

describe("monthsToTarget (FR-02)", () => {
  // GC-03: K = 100 000, m = 500, r = 4 %, T = 600 000 → n = 333,92 → 334 mesiacov
  it("GC-03: n ≈ 333,92 a po ceil 334 mesiacov", () => {
    const n = monthsToTarget(eur(100_000), eur(500), 0.04, eur(600_000));
    expect(n).not.toBeNull();
    expect(n!).toBeCloseTo(333.92, 2);
    expect(Math.ceil(n! - 1e-6)).toBe(334);
  });

  // GC-11: K ≥ T → cieľ dosiahnutý, n = 0
  it("GC-11: K ≥ T dá 0 mesiacov", () => {
    expect(monthsToTarget(eur(600_000), eur(500), 0.04, eur(600_000))).toBe(0);
  });

  // GC-08: K = 0, m = 0 → nedosiahnuteľné (bez dátumu)
  it("GC-08: K = 0 a m = 0 dá null", () => {
    expect(monthsToTarget(0, 0, 0.04, eur(600_000))).toBeNull();
  });
});

describe("targetDate (FR-02, D-024)", () => {
  // GC-13: D_L = 2026-10-14, n = 334 → 2054-08-14
  it("GC-13: D_L + 334 mesiacov je 2054-08-14", () => {
    expect(targetDate("2026-10-14", 334)).toBe("2054-08-14");
  });

  // 07 §5: 31. 1. + 1 mesiac = 28. 2. (orezanie na koniec mesiaca)
  it("orezanie na posledný deň mesiaca: 31. 1. + 1 mesiac = 28. 2.", () => {
    expect(targetDate("2027-01-31", 1)).toBe("2027-02-28");
  });

  // priestupný rok: 31. 1. 2028 + 1 mesiac = 29. 2. 2028
  it("priestupný rok: 31. 1. 2028 + 1 mesiac = 29. 2. 2028", () => {
    expect(targetDate("2028-01-31", 1)).toBe("2028-02-29");
  });
});
