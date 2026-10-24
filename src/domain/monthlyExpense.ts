import type { Capital } from "./capital";
import { goalMonths, type Rental } from "./rentalGoal";

/**
 * Mesačný výdavok (N-12b, docs/37): zníženie mesačného sporenia. Čistý výpočet, bez zápisu do dát.
 * Zníženie sa najprv berie zo sporenia do investícií, zvyšok zo sporenia do hotovosti.
 */
export interface MonthlyExpenseInput {
  base: Capital;
  expenseCents: number;
  mInv: number;
  mCash: number;
  realReturn: number;
  targetCents: number;
  rentals: Rental[];
}

export interface MonthlySaving {
  inv: number;
  cash: number;
}

type GoalResult = ReturnType<typeof goalMonths>;

export type MonthlyExpenseOutcome =
  | { ok: false; reason: "invalid_amount" | "exceeds_saving" }
  | {
      ok: true;
      savingBefore: MonthlySaving;
      savingAfter: MonthlySaving;
      before: GoalResult;
      after: GoalResult;
      /** n(pred) − n(po) v mesiacoch; záporné = cieľ ďalej. Null, ak niektorý stav cieľ nedosiahne. */
      deltaMonths: number | null;
    };

export function monthlyExpenseScenario(s: MonthlyExpenseInput): MonthlyExpenseOutcome {
  if (!(s.expenseCents > 0)) return { ok: false, reason: "invalid_amount" };
  if (s.expenseCents > s.mInv + s.mCash) return { ok: false, reason: "exceeds_saving" };
  const fromInv = Math.min(s.expenseCents, s.mInv);
  const savingAfter = { inv: s.mInv - fromInv, cash: s.mCash - (s.expenseCents - fromInv) };
  const before = goalMonths(s.base, s.mInv, s.mCash, s.realReturn, s.targetCents, s.rentals);
  const after = goalMonths(s.base, savingAfter.inv, savingAfter.cash, s.realReturn, s.targetCents, s.rentals);
  const deltaMonths = before.kind === "months" && after.kind === "months" ? before.months - after.months : null;
  return { ok: true, savingBefore: { inv: s.mInv, cash: s.mCash }, savingAfter, before, after, deltaMonths };
}
