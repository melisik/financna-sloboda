import { describe, expect, it } from "vitest";
import { goalMonths, type Rental } from "../src/domain/rentalGoal";
import { goalDisplay } from "../src/domain/goalDisplay";

const eur = (x: number) => x * 100;

const noRental: Rental = { valueCents: 0, mortgageBalanceCents: 0, mortgageRate: 0, paymentCents: 0, netRentCents: 0 };

describe("nehnuteľnosť v K: FR-02a (Fáza 2, D-080, D-087, D-058)", () => {
  it("regresia: nehnuteľnosť s V = Z0 = N = P = 0 dá rovnaký výsledok ako FR-02 (n = 362,10, GC-23)", () => {
    // K_inv = 100 000 €, m_inv = 500 €, r = 3,5 %, T = 600 000 €; FR-02a uvádza túto regresiu v docs/04.
    const withRental = goalMonths({ inv: eur(100_000), cash: 0 }, eur(500), 0, 0.035, eur(600_000), [noRental]);
    const plain = goalMonths({ inv: eur(100_000), cash: 0 }, eur(500), 0, 0.035, eur(600_000), []);
    expect(withRental.kind).toBe("months");
    expect(plain.kind).toBe("months");
    if (withRental.kind !== "months" || plain.kind !== "months") return;
    expect(withRental.months).toBeCloseTo(362.1, 2);
    expect(plain.months).toBeCloseTo(362.1, 2);
    expect(withRental.months).toBeCloseTo(plain.months, 2);
  });

  it("hotovosť v projekcii: N = −500 € mesačne, K_cash = 10 000 € → vyčerpanie v mesiaci 21 (FR-02a)", () => {
    // K_cash(k) = 10 000 € − 500 €·k; prvé k so záporným stavom je 21.
    const negativeRent: Rental = { ...noRental, netRentCents: -eur(500) };
    expect(goalMonths({ inv: 0, cash: eur(10_000) }, 0, 0, 0.035, eur(600_000), [negativeRent])).toEqual({
      kind: "cash_exhausted",
      month: 21,
    });
  });

  // nález T1 (docs/30; docs/33): po splatení hypotéky sa splátka P neplatí a čistý nájom N ide do m (D-087).
  // Z0 = 1 000 €, P = 500 €, N = 300 €, K_cash = 1 000 €: hotovosť sa po splatení (mesiac 2) nevyčerpá, rastie o N.
  it("nález T1: po splatení hypotéky sa splátka neplatí a hotovosť sa nevyčerpá (D-087)", () => {
    const payoff: Rental = {
      valueCents: eur(50_000),
      mortgageBalanceCents: eur(1_000),
      mortgageRate: 0,
      paymentCents: eur(500),
      netRentCents: eur(300),
    };
    const r = goalMonths({ inv: 0, cash: eur(1_000) }, 0, 0, 0, eur(100_000), [payoff]);
    expect(r.kind).not.toBe("cash_exhausted");
  });

  // nález T2 (docs/30; D-256): cieľ nad 600 mesiacov (50 rokov) pri rastúcom K sa zobrazí ako „Viac ako 50 rokov“ (D-019),
  // nie ako nedosiahnuteľný. Čistý nájom 100 € mesačne, bez hypotéky a investícií: 600 000 € je po 6 000 mesiacoch.
  it("nález T2: nehnuteľnosť s rastúcim K a cieľom nad 600 mesiacov je over50, nie nedosiahnuteľný", () => {
    const slow: Rental = { ...noRental, netRentCents: eur(100) };
    const res = goalMonths({ inv: 0, cash: 0 }, 0, 0, 0, eur(600_000), [slow]);
    expect(goalDisplay(res.kind === "months" ? res.months : null, "2026-10-01", "2026-10-23")).toEqual({ kind: "over50" });
  });
});
