import { describe, expect, it } from "vitest";
import { monthsToTargetSplit, payFromCash, payFromInvestments, transferToInvestments, impactMonthsSplit } from "../src/domain/capital";
import { formatImpact } from "../src/domain/impact";

const eur = (x: number) => x * 100;
const T600 = eur(600_000);

describe("monthsToTargetSplit (D-046)", () => {
  // m_cash = 0 musí dať rovnaký výsledok ako uzavretý vzorec (GC-03)
  it("m_cash = 0 zhoduje s uzavretým tvarom: 333,92 mesiaca", () => {
    const n = monthsToTargetSplit({ inv: eur(100_000), cash: 0 }, eur(500), 0, 0.04, T600);
    expect(n!).toBeCloseTo(333.92, 2);
  });

  // GC-20: K_inv = 100 000, K_cash = 0, m_cash = 500, r = 4 %, T = 600 000 → 418 mesiacov
  it("GC-20: m_cash = 500 dá n ≈ 417,4 → 418 mesiacov", () => {
    const n = monthsToTargetSplit({ inv: eur(100_000), cash: 0 }, 0, eur(500), 0.04, T600);
    expect(n!).toBeCloseTo(417.42, 1);
    expect(Math.ceil(n! - 1e-6)).toBe(418);
  });

  // GC-21: ako GC-20, ale K_cash = 100 € navyše → dopad ≈ 0,06 mesiaca ≈ 1,7 dňa
  it("GC-21: 100 € v hotovosti dá dopad približne 1,7 dňa", () => {
    const d = impactMonthsSplit(
      { inv: eur(100_000), cash: 0 },
      { inv: eur(100_000), cash: eur(100) },
      0,
      eur(500),
      0.04,
      T600,
    );
    expect(d!).toBeCloseTo(0.06, 2);
    expect(formatImpact(d!)).toBe("predbežne +2 dni");
  });

  // GC-17: K_L = 110 000 ≥ T = 100 000 → cieľ dosiahnutý (n = 0)
  it("GC-17: hotovosť sa počíta v K_L, cieľ dosiahnutý", () => {
    expect(monthsToTargetSplit({ inv: eur(50_000), cash: eur(60_000) }, eur(500), 0, 0.04, eur(100_000))).toBe(0);
  });

  // GC-18: K_inv = 90 000, K_cash = 5 000, m_inv = 500, T = 100 000 → n ≈ 6,24 → 7
  it("GC-18: n ≈ 6,24 → 7 mesiacov", () => {
    const n = monthsToTargetSplit({ inv: eur(90_000), cash: eur(5_000) }, eur(500), 0, 0.04, eur(100_000));
    expect(n!).toBeCloseTo(6.24, 1);
    expect(Math.ceil(n! - 1e-6)).toBe(7);
  });
});

describe("výdavky z kapitálu (D-045)", () => {
  // GC-19 (D-058): K_cash = 20 000, rezerva = 6 000 mimo K_cash; výdavok 15 000 z hotovosti prejde, rezerva sa nedotkne
  it("GC-19: výdavok z hotovosti do výšky K_cash prejde; rezerva nie je v kontrole", () => {
    const r = payFromCash({ inv: eur(100_000), cash: eur(20_000) }, eur(15_000));
    expect(r.ok && r.capital).toEqual({ inv: eur(100_000), cash: eur(5_000) });
    const inv = payFromInvestments({ inv: eur(100_000), cash: eur(20_000) }, eur(15_000));
    expect(inv.ok && inv.capital.inv).toBe(eur(85_000));
  });

  it("výdavok z hotovosti nad K_cash je zamietnutý a navrhne sa zdroj z investícií", () => {
    const r = payFromCash({ inv: eur(100_000), cash: eur(20_000) }, eur(25_000));
    expect(r).toEqual({ ok: false, reason: "insufficient_cash", suggestion: "investments" });
  });

  // GC-15: dva výdavky po 60 000 € z investícií: K_inv sa zastaví na 0, dopad −154 mesiacov
  it("GC-15: K_inv nesmie byť záporný; dopad je −154 mesiacov", () => {
    let c = { inv: eur(100_000), cash: 0 };
    const first = payFromInvestments(c, eur(60_000));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    c = first.capital;
    const second = payFromInvestments(c, eur(60_000));
    expect(second.ok && second.warning).toBe("exhausted");
    if (!second.ok) return;
    expect(second.capital.inv).toBe(0);
    const d = impactMonthsSplit({ inv: eur(100_000), cash: 0 }, second.capital, eur(500), 0, 0.04, T600);
    expect(d!).toBeCloseTo(-154.1, 1);
    expect(formatImpact(d!)).toBe("predbežne −154 mesiace");
  });

  it("presun do investícií nemení K a nesmie vyčerpať viac než K_cash (D-058)", () => {
    const ok = transferToInvestments({ inv: eur(100_000), cash: eur(20_000) }, eur(10_000));
    expect(ok.ok && ok.capital).toEqual({ inv: eur(110_000), cash: eur(10_000) });
    const blocked = transferToInvestments({ inv: eur(100_000), cash: eur(20_000) }, eur(25_000));
    expect(blocked.ok).toBe(false);
  });
});

describe("scenáre a hranice (D-050, GC-05, GC-06, GC-23)", () => {
  const cap = { inv: eur(100_000), cash: 0 };
  const T = eur(600_000);
  it("GC-05: optimistický scenár je základ + 2 p. b. = 5,5 %; n ≈ 271,67 → 272 mesiacov", () => {
    expect(Math.ceil(monthsToTargetSplit(cap, eur(500), 0, 0.055, T)! - 1e-6)).toBe(272);
  });
  it("GC-23: základ 3,5 % (D-050); n ≈ 362,10 → 363 mesiacov", () => {
    expect(Math.ceil(monthsToTargetSplit(cap, eur(500), 0, 0.035, T)! - 1e-6)).toBe(363);
  });
  it("GC-06: opatrný scenár je základ − 2 p. b. = 1,5 %; n ≈ 556,46 → 557 mesiacov", () => {
    expect(Math.ceil(monthsToTargetSplit(cap, eur(500), 0, 0.015, T)! - 1e-6)).toBe(557);
  });
  it("r = 0 a m = 0 pri K > 0 je nedosiahnuteľné (null)", () => {
    expect(monthsToTargetSplit(cap, 0, 0, 0, T)).toBeNull();
  });
});
