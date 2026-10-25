import type { BudgetCategory, RecurringExpense } from "./model/entities";

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

/** Súčet platných pravidelných výdavkov za rok (mesačné × 12, ročné ako sú). Iba zobrazenie (D-124). */
export function annualRecurringTotalCents(list: RecurringExpense[], today: string): number {
  return list
    .filter((e) => isRecurringActive(e, today))
    .reduce((sum, e) => sum + (e.frequency === "mesacne" ? e.amountCents * 12 : e.amountCents), 0);
}

/** Koniec platnosti do daného počtu dní od dneška. Dnešný koniec sa nepočíta: položka ukončená tlačidlom je zámer. */
export function endingSoon(e: RecurringExpense, today: string, days = 30): boolean {
  if (e.endDate === undefined || !isRecurringActive(e, today)) return false;
  const left = Math.round((Date.UTC(...dateParts(e.endDate)) - Date.UTC(...dateParts(today))) / 86_400_000);
  return left >= 1 && left <= days;
}

function dateParts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m - 1, d];
}

/** Tolerancia zhody sumy výdavku s pravidelným výdavkom (D-299, docs/53). */
const MATCH_TOLERANCE_CENTS = 100;

/**
 * Pravidelný výdavok, ktorému sa zhoduje nový výdavok: platí v deň výdavku, rovnaká kategória a suma ±1 €
 * (ročný sa porovnáva s ročnou sumou). Slúži len na upozornenie na dvojitý zápis (D-299, docs/53: P-B); nič neblokuje.
 */
export function matchingRecurring(list: RecurringExpense[], t: { date: string; category: BudgetCategory | undefined; amountCents: number }): RecurringExpense | null {
  if (t.category === undefined) return null;
  const candidates = list
    .filter((e) => e.category === t.category && isRecurringActive(e, t.date) && Math.abs(e.amountCents - t.amountCents) <= MATCH_TOLERANCE_CENTS)
    .sort((a, b) => Math.abs(a.amountCents - t.amountCents) - Math.abs(b.amountCents - t.amountCents));
  return candidates[0] ?? null;
}
