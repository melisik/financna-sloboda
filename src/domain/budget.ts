import type { Budget, BudgetCategory, Transaction } from "../storage/types";

/** Výdavky v kategórii za mesiac, do ktorého patrí dnešok (D-106). Nezaradené výdavky sa počítajú len do súčtu bez kategórie. */
export function spentInMonthCents(transactions: Transaction[], category: BudgetCategory | null, today: string): number {
  const month = today.slice(0, 7);
  return transactions
    .filter((t) => t.type === "vydavok" && t.date.slice(0, 7) === month && (t.category ?? null) === category)
    .reduce((sum, t) => sum + t.amountCents, 0);
}

/** Stav limitu: zostáva, alebo prekročené o túto sumu. */
export function budgetStatus(b: Budget | undefined, spentCents: number): { remainingCents: number; over: boolean } | null {
  if (!b) return null;
  const remaining = b.limitCents - spentCents;
  return { remainingCents: Math.abs(remaining), over: remaining < 0 };
}
