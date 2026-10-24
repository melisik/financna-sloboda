import { describe, expect, it } from "vitest";
import { bigExpenseScenario } from "../src/domain/expenseScenario";
import { impactWithRentals } from "../src/domain/rentalGoal";

// Scenár veľkého výdavku (N-12, docs/36). Syntetické hodnoty v centoch.
const base = { inv: 10_000_000, cash: 1_000_000 }; // K_inv = 100 000 €, K_cash = 10 000 €
const common = { mInv: 50_000, mCash: 0, realReturn: 0.035, targetCents: 60_000_000, rentals: [] };

describe("scenár veľkého výdavku: výpočet bez zápisu", () => {
  it("výdavok z hotovosti zníži len hotovosť", () => {
    const out = bigExpenseScenario({ base, amountCents: 500_000, source: "z_hotovosti", ...common });
    expect(out).toMatchObject({ ok: true, exhausted: false, after: { inv: 10_000_000, cash: 500_000 } });
  });

  it("výdavok z investícií zníži len investície", () => {
    const out = bigExpenseScenario({ base, amountCents: 500_000, source: "z_investicii", ...common });
    expect(out).toMatchObject({ ok: true, exhausted: false, after: { inv: 9_500_000, cash: 1_000_000 } });
  });

  it("výdavok z príjmu nemení kapitál a dopad je nulový", () => {
    const out = bigExpenseScenario({ base, amountCents: 500_000, source: "z_prijmu", ...common });
    expect(out).toMatchObject({ ok: true, after: base });
    if (out.ok) expect(out.impact).toEqual({ kind: "delta", months: 0 });
  });

  it("dopad je rovnaký ako v Transakciách (impactWithRentals)", () => {
    const out = bigExpenseScenario({ base, amountCents: 500_000, source: "z_hotovosti", ...common });
    expect(out.ok).toBe(true);
    if (out.ok) {
      const expected = impactWithRentals(base, out.after, common.mInv, common.mCash, common.realReturn, common.targetCents, common.rentals);
      expect(out.impact).toEqual(expected);
    }
  });

  it("výdavok posunie cieľ ďalej, teda dopad je záporný", () => {
    const out = bigExpenseScenario({ base, amountCents: 500_000, source: "z_investicii", ...common });
    expect(out.ok).toBe(true);
    if (out.ok && out.impact.kind === "delta") expect(out.impact.months).toBeLessThan(0);
  });

  it("dátumy cieľa bez výdavku a s výdavkom sú čísla mesiacov, ak cieľ existuje", () => {
    const out = bigExpenseScenario({ base, amountCents: 500_000, source: "z_hotovosti", ...common });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(typeof out.monthsBefore).toBe("number");
      expect(typeof out.monthsAfter).toBe("number");
      expect(out.monthsAfter!).toBeGreaterThan(out.monthsBefore!);
    }
  });

  it("nulová, záporná alebo neplatná suma sa odmietne", () => {
    for (const amountCents of [0, -100, Number.NaN]) {
      expect(bigExpenseScenario({ base, amountCents, source: "z_hotovosti", ...common })).toEqual({ ok: false, reason: "invalid_amount" });
    }
  });

  it("výdavok väčší než hotovosť sa z hotovosti odmietne a navrhne zdroj z investícií", () => {
    expect(bigExpenseScenario({ base, amountCents: 2_000_000, source: "z_hotovosti", ...common })).toEqual({ ok: false, reason: "insufficient_cash" });
  });

  it("výdavok väčší než investície ich vyčerpá a označí to", () => {
    const out = bigExpenseScenario({ base, amountCents: 20_000_000, source: "z_investicii", ...common });
    expect(out).toMatchObject({ ok: true, exhausted: true, after: { inv: 0, cash: 1_000_000 } });
  });

  it("ak cieľ nie je dosiahnuteľný ani bez výdavku, dátumy sú null", () => {
    const out = bigExpenseScenario({ base: { inv: 0, cash: 0 }, amountCents: 1, source: "z_investicii", ...common, mInv: 0 });
    if (out.ok) {
      expect(out.monthsBefore).toBeNull();
      expect(out.monthsAfter).toBeNull();
    }
  });
});
