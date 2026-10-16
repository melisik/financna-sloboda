import { describe, expect, it } from "vitest";
import { monthlyRate } from "../src/domain/goal";
import { monthsToTargetWithProperty, type PropertyInput } from "../src/domain/property";

const eur = (x: number) => x * 100;
// Reálna mesačná sadzba hypotéky: nominálna 3 %, inflácia 2 % (predpoklad A2, FR-02a)
const iH = Math.pow(1.03 / 1.02, 1 / 12) - 1;

const base: PropertyInput = {
  kInvCents: eur(100_000),
  kCashCents: 0,
  mInvCents: 0,
  mCashCents: 0,
  annualRate: 0.035,
  targetCents: eur(600_000),
  propertyValueCents: eur(300_000),
  mortgageBalanceCents: eur(200_000),
  monthlyPaymentCents: eur(1_000),
  monthlyNetRentCents: eur(1_200),
  monthlyMortgageRate: iH,
};

describe("monthsToTargetWithProperty (FR-02a, Fáza 2)", () => {
  // GC-P2-01: n ≈ 257,2 → 258 mesiacov od D_L
  it("GC-P2-01: n ≈ 257,2 a po ceil 258 mesiacov", () => {
    const res = monthsToTargetWithProperty(base);
    expect(res.kind).toBe("months");
    if (res.kind !== "months") return;
    expect(res.months).toBeCloseTo(257.25, 1);
    expect(Math.ceil(res.months - 1e-6)).toBe(258);
  });

  // GC-P2-02: K_cash = 0 v mesiaci 25, v mesiaci 26 by bolo záporné → zastavenie
  it("GC-P2-02: blokované v mesiaci 26 (hotovosť 0 v mesiaci 25)", () => {
    const res = monthsToTargetWithProperty({
      ...base,
      kCashCents: eur(10_000),
      monthlyNetRentCents: eur(600),
    });
    expect(res).toEqual({ kind: "blocked", month: 26 });
  });

  // Regresia FR-02 (bez nehnuteľnosti, m = 500 € investícia, r = 4 %, T = 600 000): n ≈ 333,92
  it("regresia: bez nehnuteľnosti sa výsledok zhoduje s FR-02 (GC-03)", () => {
    const res = monthsToTargetWithProperty({
      ...base,
      kInvCents: eur(100_000),
      mInvCents: eur(500),
      annualRate: 0.04,
      propertyValueCents: 0,
      mortgageBalanceCents: 0,
      monthlyPaymentCents: 0,
      monthlyNetRentCents: 0,
      monthlyMortgageRate: 0,
    });
    expect(res.kind).toBe("months");
    if (res.kind !== "months") return;
    expect(res.months).toBeCloseTo(333.92, 1);
  });

  it("K ≥ T dá 0 mesiacov", () => {
    expect(monthsToTargetWithProperty({ ...base, kInvCents: eur(700_000) })).toEqual({
      kind: "months",
      months: 0,
    });
  });

  it("bez toku sa cieľ nedosiahne v horizonte 50 rokov", () => {
    expect(
      monthsToTargetWithProperty({
        ...base,
        kInvCents: 0,
        propertyValueCents: 0,
        mortgageBalanceCents: 0,
        monthlyPaymentCents: 0,
        monthlyNetRentCents: 0,
        monthlyMortgageRate: 0,
      }),
    ).toEqual({ kind: "unreachable" });
  });

  it("monthlyRate zodpovedá FR-02 (r = 3,5 %)", () => {
    expect(monthlyRate(0.035)).toBeCloseTo(0.0028709, 6);
  });
});
