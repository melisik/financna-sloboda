import { monthsToTarget } from "./goal";
import type { Impact } from "./rentalGoal";

/**
 * Text, ak dopad nemožno vyčísliť, lebo niektorý stav cieľ nedosiahne (R26b, schválené zakladateľom).
 * Uvádza aj možnosti, ako cieľ dosiahnuť. Nie je to finančné poradenstvo; odhad je pred daňou a poplatkami.
 */
export const UNREACHABLE_IMPACT_TEXT =
  "Po tejto transakcii sa cieľ pri súčasnom sporení a výnose nedosiahne. Ako sa k nemu dostať: " +
  "(1) zvýšiť mesačné sporenie do investícií alebo hotovosti; " +
  "(2) znížiť ročné výdavky, čím sa zmenší cieľová suma; " +
  "(3) pri výdavku zvoliť zdroj „z príjmu“, ak to ide, aby kapitál zostal; " +
  "(4) zvážiť vyššiu mieru výberu v rozsahu 3–4 %: cieľová suma sa zníži, ale kapitál by pri zlom vývoji trhu vydržal kratšie. " +
  "Odhad je pred daňou a poplatkami a nie je finančným poradenstvom.";

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

/**
 * Text výsledku dopadu pre UI (FR-04, FR-02a). Vyčerpanie hotovosti sa pomenuje, nie zamieňa za „cieľ sa nedosiahne“:
 * ide o iný dôvod a iné riešenie (zdroj alebo suma výdavku).
 */
export function formatImpactOutcome(i: Impact): string {
  switch (i.kind) {
    case "delta":
      return formatImpact(i.months);
    case "unreachable":
      return UNREACHABLE_IMPACT_TEXT;
    case "cash_exhausted":
      return i.side === "after"
        ? `Po tejto transakcii by sa hotovosť vyčerpala v mesiaci ${i.month}. Dopad sa nedá vyčísliť; zváž iný zdroj alebo nižšiu sumu.`
        : `Hotovosť by sa vyčerpala už v mesiaci ${i.month}, aj bez tejto transakcie. Dopad sa nedá vyčísliť.`;
  }
}

/** Slovenské skloňovanie čísla pri jednotkách: 1 mesiac / 2–4 mesiace / 5+ mesiacov. */
export function plural(n: number, one: string, few: string, many: string): string {
  const last = n % 10;
  const lastTwo = n % 100;
  if (last === 1 && lastTwo !== 11) return one;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
  return many;
}

/**
 * Text dopadu (FR-04, D-014): v mesiacoch pri |dopad| ≥ 1, inak v dňoch (N1).
 * Presne nula sa zobrazí ako „bez zmeny“; nenulový dopad pod pol dňa ako „menej ako 1 deň“ so znamienkom (R26).
 */
export function formatImpact(delta: number): string {
  if (Math.abs(delta) >= 1) {
    const k = Math.round(Math.abs(delta)); // symetricky: −2,5 a +2,5 dajú 3 mesiace
    if (k === 0) return "bez zmeny";
    const sign = delta > 0 ? "+" : "−";
    return `predbežne ${sign}${k} ${plural(k, "mesiac", "mesiace", "mesiacov")}`;
  }
  if (delta === 0) return "bez zmeny";
  const days = Math.round(Math.abs(delta) * DAYS_PER_MONTH);
  const sign = delta > 0 ? "+" : "−";
  if (days === 0) return `predbežne ${sign}menej ako 1 deň`;
  return `predbežne ${sign}${days} ${plural(days, "deň", "dni", "dní")}`;
}
