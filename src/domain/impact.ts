import { monthsToTarget } from "./goal";

/** Priemerný počet dní v mesiaci (FR-04, N1: 1 mesiac = 30,44 dňa). */
const DAYS_PER_MONTH = 30.44;

/**
 * Predbežný dopad transakcie (FR-04, N1): n(K_L) − n(K_pred) v mesiacoch, surový rozdiel.
 * Kladné = cieľ bližšie, záporné = ďalej. Null, ak niektorý scenár cieľ nedosiahne.
 */
export function impactMonths(
  capitalCents: number,
  pendingCapitalCents: number,
  monthlySavingCents: number,
  annualRate: number,
  targetCents: number,
): number | null {
  const before = monthsToTarget(capitalCents, monthlySavingCents, annualRate, targetCents);
  const after = monthsToTarget(pendingCapitalCents, monthlySavingCents, annualRate, targetCents);
  if (before === null || after === null) return null;
  return before - after;
}

/** Slovenské skloňovanie čísla pri jednotkách: 1 mesiac / 2–4 mesiace / 5+ mesiacov. */
function plural(n: number, one: string, few: string, many: string): string {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return one;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

/**
 * Text dopadu (FR-04, D-014): v mesiacoch pri |dopad| ≥ 1, inak v dňoch (N1).
 * Nula sa zobrazí ako „bez zmeny“.
 */
export function formatImpact(delta: number): string {
  if (Math.abs(delta) >= 1) {
    const k = Math.round(Math.abs(delta)); // symetricky: −2,5 a +2,5 dajú 3 mesiace
    if (k === 0) return "bez zmeny";
    const sign = delta > 0 ? "+" : "−";
    return `predbežne ${sign}${k} ${plural(k, "mesiac", "mesiace", "mesiacov")}`;
  }
  const days = Math.round(Math.abs(delta) * DAYS_PER_MONTH);
  if (days === 0) return "bez zmeny";
  const sign = delta > 0 ? "+" : "−";
  return `predbežne ${sign}${days} ${plural(days, "deň", "dni", "dní")}`;
}
