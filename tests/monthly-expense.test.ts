import { describe, expect, it } from "vitest";
import { monthlyExpenseScenario } from "../src/domain/monthlyExpense";
import { goalMonths } from "../src/domain/rentalGoal";

// Mesačný výdavok (N-12b, docs/37): zníženie mesačného sporenia. Syntetické hodnoty v centoch.
const base = { inv: 10_000_000, cash: 1_000_000 };
const common = { realReturn: 0.035, targetCents: 60_000_000, rentals: [] };

describe("mesačný výdavok: zníženie sporenia", () => {
  it("neplatná alebo nulová suma sa odmietne", () => {
    for (const expenseCents of [0, -100, Number.NaN]) {
      expect(monthlyExpenseScenario({ base, expenseCents, mInv: 50_000, mCash: 10_000, ...common })).toEqual({ ok: false, reason: "invalid_amount" });
    }
  });

  it("suma nad súčet sporení sa nepočíta", () => {
    expect(monthlyExpenseScenario({ base, expenseCents: 60_001, mInv: 50_000, mCash: 10_000, ...common })).toEqual({ ok: false, reason: "exceeds_saving" });
  });

  it("zníženie sa najprv zoberie zo sporenia do investícií", () => {
    const out = monthlyExpenseScenario({ base, expenseCents: 20_000, mInv: 50_000, mCash: 10_000, ...common });
    expect(out).toMatchObject({ ok: true, savingBefore: { inv: 50_000, cash: 10_000 }, savingAfter: { inv: 30_000, cash: 10_000 } });
  });

  it("zvyšok presahuje do sporenia do hotovosti", () => {
    const out = monthlyExpenseScenario({ base, expenseCents: 60_000, mInv: 50_000, mCash: 20_000, ...common });
    expect(out).toMatchObject({ ok: true, savingAfter: { inv: 0, cash: 10_000 } });
  });

  it("vyšší výdavok posunie cieľ ďalej, dopad je záporný", () => {
    const out = monthlyExpenseScenario({ base, expenseCents: 20_000, mInv: 50_000, mCash: 0, ...common });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.deltaMonths).not.toBeNull();
      expect(out.deltaMonths!).toBeLessThan(0);
    }
  });

  it("výsledok po výdavku zodpovedá goalMonths so zníženým sporením", () => {
    const out = monthlyExpenseScenario({ base, expenseCents: 20_000, mInv: 50_000, mCash: 0, ...common });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.after).toEqual(goalMonths(base, 30_000, 0, common.realReturn, common.targetCents, common.rentals));
    }
  });

  it("ak cieľ po výdavku nie je dosiahnuteľný, dopad je null", () => {
    const out = monthlyExpenseScenario({ base: { inv: 0, cash: 0 }, expenseCents: 1_000, mInv: 1_000, mCash: 0, ...common });
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.after.kind).toBe("unreachable");
      expect(out.deltaMonths).toBeNull();
    }
  });
});
