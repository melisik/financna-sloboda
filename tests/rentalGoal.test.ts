import { describe, expect, it } from "vitest";
import {
  goalMonths,
  impactWithRentals,
  monthsToTargetWithRentals,
  rentalsFor,
  type Rental,
} from "../src/domain/rentalGoal";
import { formatImpactOutcome } from "../src/domain/impact";
import type { Property } from "../src/storage/types";

// Golden cases FR-02a (docs/04, GC-P2-01 až GC-P2-04). Syntetické hodnoty v centoch.
const T = 60_000_000; // 600 000 €
const r = 0.035;
const base = { inv: 10_000_000, cash: 0 }; // K_inv = 100 000 €
const mainRental: Rental = {
  valueCents: 30_000_000,
  mortgageBalanceCents: 20_000_000,
  mortgageRate: 0.03,
  paymentCents: 100_000,
  netRentCents: 120_000,
};

describe("FR-02a – golden cases", () => {
  it("GC-P2-01: n ≈ 257,25 mesiaca", () => {
    const res = monthsToTargetWithRentals(base, 0, 0, r, T, [mainRental]);
    expect(res.kind).toBe("months");
    if (res.kind === "months") expect(res.months).toBeCloseTo(257.25, 1);
  });

  it("GC-P2-02: hotovosť sa vyčerpá v mesiaci 26", () => {
    const res = monthsToTargetWithRentals({ inv: 10_000_000, cash: 1_000_000 }, 0, 0, r, T, [
      { ...mainRental, netRentCents: 60_000 },
    ]);
    expect(res).toEqual({ kind: "cash_exhausted", month: 26 });
  });

  it("GC-P2-04: splátka nepokrýva úrok, n ≈ 273,08 mesiaca", () => {
    const res = monthsToTargetWithRentals(base, 0, 0, r, T, [{ ...mainRental, paymentCents: 10_000 }]);
    expect(res.kind).toBe("months");
    if (res.kind === "months") expect(res.months).toBeCloseTo(273.08, 1);
  });

  it("GC-P2-03: vlastné bývanie do K nevstupuje, výsledok je 362,10 mesiaca", () => {
    const own: Property = {
      id: "p1",
      mode: "vlastne_byvanie",
      valueCents: 30_000_000,
      valueDate: "2026-10-01",
      mortgageBalanceCents: 20_000_000,
      mortgageRate: 0.03,
      monthlyPaymentCents: 100_000,
      monthlyRentCents: 120_000,
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    };
    const rentals = rentalsFor([own]);
    expect(rentals).toHaveLength(0);
    const res = goalMonths({ inv: 10_000_000, cash: 0 }, 50_000, 0, r, T, rentals);
    expect(res.kind).toBe("months");
    if (res.kind === "months") expect(res.months).toBeCloseTo(362.1, 1);
  });
});

describe("FR-02a – regresia", () => {
  it("bez nehnuteľnosti je výsledok rovnaký ako FR-02 (362,10 mesiaca)", () => {
    const res = goalMonths({ inv: 10_000_000, cash: 0 }, 50_000, 0, r, T, []);
    expect(res.kind).toBe("months");
    if (res.kind === "months") expect(res.months).toBeCloseTo(362.1, 1);
  });

  it("nulová nehnuteľnosť (V = 0, Z0 = 0, N = P = 0) dá takmer rovnaký výsledok ako FR-02", () => {
    const zero: Rental = { valueCents: 0, mortgageBalanceCents: 0, mortgageRate: 0, paymentCents: 0, netRentCents: 0 };
    const res = monthsToTargetWithRentals({ inv: 10_000_000, cash: 0 }, 50_000, 0, r, T, [zero]);
    expect(res.kind).toBe("months");
    if (res.kind === "months") expect(res.months).toBeCloseTo(362.1, 1);
  });
});

describe("FR-02a – rentalsFor a dopad", () => {
  it("do K vstupuje len prenájom", () => {
    const base: Property = {
      id: "p",
      mode: "prenajom",
      valueCents: 1,
      valueDate: "2026-10-01",
      mortgageBalanceCents: 0,
      createdAt: "",
      updatedAt: "",
    };
    const list = rentalsFor([
      base,
      { ...base, id: "q", mode: "nezadane" },
      { ...base, id: "s", mode: "vlastne_byvanie" },
    ]);
    expect(list).toHaveLength(1);
  });

  it("dopad je rozdiel dvoch n a bez zmeny pri rovnakom stave", () => {
    const c = { inv: 10_000_000, cash: 0 };
    expect(impactWithRentals(c, c, 0, 0, r, T, [mainRental])).toEqual({ kind: "delta", months: 0 });
  });

  it("transakcia, po ktorej hotovosť klesne pod 0, je cash_exhausted na strane po transakcii", () => {
    // Pred transakciou vystačí hotovosť do mesiaca 51, po transakcii do mesiaca 26 (GC-P2-02 logika).
    const drain: Rental = { ...mainRental, netRentCents: 60_000 };
    const before = { inv: 10_000_000, cash: 2_000_000 };
    const after = { inv: 10_000_000, cash: 1_000_000 };
    expect(impactWithRentals(before, after, 0, 0, r, T, [drain])).toEqual({ kind: "cash_exhausted", side: "after", month: 26 });
  });

  it("text vyčerpania hotovosti pomenuje mesiac a nezamieňa ho za nedosiahnuteľný cieľ", () => {
    const text = formatImpactOutcome({ kind: "cash_exhausted", side: "after", month: 26 });
    expect(text).toContain("vyčerpala v mesiaci 26");
    expect(text).not.toContain("nedosiahne");
    expect(formatImpactOutcome({ kind: "delta", months: 2 })).toBe("predbežne +2 mesiace");
    expect(formatImpactOutcome({ kind: "unreachable" })).toContain("nedosiahne");
  });
});
