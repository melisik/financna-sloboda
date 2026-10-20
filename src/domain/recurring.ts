import type { BudgetCategory, RecurringExpense } from "../storage/types";

/** Pravidelný výdavok platí dnes, ak je dnešný dátum medzi začiatkom a koncom (koniec bez hodnoty = trvá). */
export function isRecurringActive(e: RecurringExpense, today: string): boolean {
  return e.startDate <= today && (e.endDate === undefined || today <= e.endDate);
}

/** Suma pripadajúca na jeden mesiac; ročná suma sa delí dvanástimi (D-124). */
export function monthlyShareCents(e: RecurringExpense): number {
  return e.frequency === "mesacne" ? e.amountCents : Math.round(e.amountCents / 12);
}

/** Súčet platných pravidelných výdavkov za mesiac. Iba zobrazenie; K ani sporenie sa nemenia (D-124). */
export function monthlyRecurringTotalCents(list: RecurringExpense[], today: string): number {
  return list.filter((e) => isRecurringActive(e, today)).reduce((sum, e) => sum + monthlyShareCents(e), 0);
}

/** Súčet platných pravidelných výdavkov za mesiac podľa kategórie z rozpočtu (D-124). */
export function monthlyRecurringByCategory(list: RecurringExpense[], today: string): Partial<Record<BudgetCategory, number>> {
  const out: Partial<Record<BudgetCategory, number>> = {};
  for (const e of list.filter((x) => isRecurringActive(x, today))) {
    out[e.category] = (out[e.category] ?? 0) + monthlyShareCents(e);
  }
  return out;
}
