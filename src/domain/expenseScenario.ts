import { payFromCash, payFromInvestments, type Capital } from "./capital";
import { goalMonths, impactWithRentals, type Impact, type Rental } from "./rentalGoal";
import type { Source } from "./model/entities";

/**
 * Scenár veľkého výdavku (N-12, docs/36): dopad výdavku na cieľ bez zápisu do dát.
 * Používa rovnaké funkcie ako predbežný dopad v Transakciách, takže výsledky sa zhodujú.
 */
export interface ExpenseScenarioInput {
  base: Capital;
  amountCents: number;
  source: Source;
  mInv: number;
  mCash: number;
  realReturn: number;
  targetCents: number;
  rentals: Rental[];
}

export type ExpenseScenarioOutcome =
  | { ok: false; reason: "invalid_amount" | "insufficient_cash" }
  | { ok: true; after: Capital; exhausted: boolean; impact: Impact; monthsBefore: number | null; monthsAfter: number | null };

/** Počet mesiacov do cieľa, alebo null, ak cieľ nie je dosiahnuteľný alebo hotovosť vyčerpá skôr. */
function monthsOf(c: Capital, s: ExpenseScenarioInput): number | null {
  const g = goalMonths(c, s.mInv, s.mCash, s.realReturn, s.targetCents, s.rentals);
  return g.kind === "months" ? g.months : null;
}

export function bigExpenseScenario(s: ExpenseScenarioInput): ExpenseScenarioOutcome {
  if (!(s.amountCents > 0)) return { ok: false, reason: "invalid_amount" };
  let after = s.base;
  let exhausted = false;
  if (s.source === "z_hotovosti") {
    const r = payFromCash(s.base, s.amountCents);
    if (!r.ok) return { ok: false, reason: r.reason };
    after = r.capital;
  } else if (s.source === "z_investicii") {
    const r = payFromInvestments(s.base, s.amountCents);
    if (!r.ok) return { ok: false, reason: r.reason };
    after = r.capital;
    exhausted = r.warning === "exhausted";
  }
  const impact = impactWithRentals(s.base, after, s.mInv, s.mCash, s.realReturn, s.targetCents, s.rentals);
  return { ok: true, after, exhausted, impact, monthsBefore: monthsOf(s.base, s), monthsAfter: monthsOf(after, s) };
}
