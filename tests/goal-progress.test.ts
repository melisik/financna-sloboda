import { describe, expect, it } from "vitest";
import { goalDateShift, goalProgress } from "../src/domain/progress";
import type { Rental } from "../src/domain/rentalGoal";

// Pokrok k cieľu a posun dátumu cieľa na Prehľade (D-283, docs/43 A1). Syntetické hodnoty v centoch.
const rental: Rental = { valueCents: 20_000_000, mortgageBalanceCents: 5_000_000, mortgageRate: 0.04, paymentCents: 60_000, netRentCents: 50_000 };

describe("pokrok k cieľovej sume", () => {
  it("bez nehnuteľností: kapitál je investície a hotovosť, percento sa zaokrúhľuje nadol", () => {
    expect(goalProgress({ inv: 29_500_000, cash: 900_000 }, 60_000_000, [])).toEqual({ haveCents: 30_400_000, targetCents: 60_000_000, percent: 50 });
  });

  it("nehnuteľnosť v prenájme sa počíta hodnotou mínus zostatok hypotéky, rovnako ako výpočet cieľa", () => {
    expect(goalProgress({ inv: 10_000_000, cash: 0 }, 60_000_000, [rental]).haveCents).toBe(25_000_000);
  });

  it("percento je medzi 0 a 100", () => {
    expect(goalProgress({ inv: 70_000_000, cash: 0 }, 60_000_000, []).percent).toBe(100);
    expect(goalProgress({ inv: 0, cash: -100_000 }, 60_000_000, []).percent).toBe(0);
    expect(goalProgress({ inv: 59_999_999, cash: 0 }, 60_000_000, []).percent).toBe(99);
  });
});

describe("posun dátumu cieľa od predchádzajúceho vyhodnotenia", () => {
  // r = 0, sporenie 1 000 € do hotovosti, cieľ 600 000 €: 300 000 € → 300 mesiacov, 310 000 € → 290 mesiacov.
  const base = { mInv: 0, mCash: 100_000, rate: 0, targetCents: 60_000_000, rentals: [] as Rental[] };
  const prev = { date: "2026-08-31", investmentsCents: 0, cashCents: 30_000_000 };

  it("vyšší kapitál o mesiac neskôr posunie dátum bližšie (31.08.2026 + 300 m. = 08/2051, 30.09.2026 + 290 m. = 11/2050)", () => {
    expect(goalDateShift({ ...base, previous: prev, latestDate: "2026-09-30", capital: { inv: 0, cash: 31_000_000 } })).toEqual({ months: 9, since: "2026-08-31" });
  });

  it("nižší kapitál posunie dátum ďalej (záporné mesiace)", () => {
    expect(goalDateShift({ ...base, previous: prev, latestDate: "2026-09-30", capital: { inv: 0, cash: 29_000_000 } })?.months).toBe(-11);
  });

  it("rovnaký cieľový mesiac je posun 0", () => {
    expect(goalDateShift({ ...base, previous: prev, latestDate: "2026-09-30", capital: { inv: 0, cash: 30_100_000 } })?.months).toBe(0);
  });

  it("bez predchádzajúceho vyhodnotenia, pri nedosiahnuteľnom, dosiahnutom alebo vzdialenejšom ako 50 rokov cieli sa posun nezobrazí", () => {
    expect(goalDateShift({ ...base, previous: null, latestDate: "2026-09-30", capital: { inv: 0, cash: 31_000_000 } })).toBeNull();
    expect(goalDateShift({ ...base, mCash: 0, previous: prev, latestDate: "2026-09-30", capital: { inv: 0, cash: 31_000_000 } })).toBeNull();
    expect(goalDateShift({ ...base, previous: prev, latestDate: "2026-09-30", capital: { inv: 0, cash: 60_000_000 } })).toBeNull();
    expect(goalDateShift({ ...base, mCash: 10_000, previous: prev, latestDate: "2026-09-30", capital: { inv: 0, cash: 31_000_000 } })).toBeNull();
  });
});
