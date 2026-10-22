import { targetDate } from "./goal";

/** Horizont zobrazenia dátumu cieľa: 50 rokov (O-5, GC-12). */
export const HORIZON_MONTHS = 600;

export type GoalDisplay =
  | { kind: "reached"; date: string }
  | { kind: "unreachable" }
  | { kind: "over50" }
  | { kind: "stale"; date: string }
  | { kind: "date"; date: string; remainingMonths: number };

/** Počet celých mesiacov od todayIso do dateIso (oba ISO „YYYY-MM-DD“), nezáporný. */
export function monthsBetween(todayIso: string, dateIso: string): number {
  const [y1, m1, d1] = todayIso.split("-").map(Number);
  const [y2, m2, d2] = dateIso.split("-").map(Number);
  const months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  return Math.max(0, months);
}

/**
 * Zobrazenie dátumu cieľa (FR-02, FR-10, D-019, D-024).
 * months = výsledok monthsToTarget (null = nedosiahnuteľné); lastReviewIso = D_L; todayIso = dnešok.
 * Dátum sa nemení s časom; zostávajúci čas je len informácia a nikdy nie je záporný (FR-10).
 */
export function goalDisplay(
  months: number | null,
  lastReviewIso: string,
  todayIso: string,
): GoalDisplay {
  if (months === null || !(months >= 0)) return { kind: "unreachable" };
  if (months === 0) return { kind: "reached", date: lastReviewIso };
  if (months > HORIZON_MONTHS) return { kind: "over50" };
  const date = targetDate(lastReviewIso, months);
  if (todayIso > date) return { kind: "stale", date };
  return { kind: "date", date, remainingMonths: monthsBetween(todayIso, date) };
}
