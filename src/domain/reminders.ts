import { daysSince } from "./dates";
/**
 * Pripomienky (FR-10, FR-19, D-016, D-035). Čisté funkcie, bez času v pozadí.
 * Pripomienka je jemná: nič sa automaticky nemení ani nevynucuje.
 */

/** Vyhodnotenie za predchádzajúci mesiac chýba (FR-10): posledné je v inom, staršom mesiaci. */
export function reviewOverdue(lastReviewIso: string | null, todayIso: string): boolean {
  if (!lastReviewIso) return false; // prvé vyhodnotenie sa rieši výzvou v prvom nastavení (L6)
  const idx = (iso: string) => {
    const [y, m] = iso.slice(0, 7).split("-").map(Number);
    return y * 12 + (m - 1);
  };
  // Vyhodnotenie sa robí na konci mesiaca. Posledné vyhodnotenie v predchádzajúcom alebo tomto mesiaci stačí.
  return idx(todayIso) - idx(lastReviewIso) >= 2;
}

/** Okno pred koncom mesiaca, v ktorom sa upozorní na chýbajúce vyhodnotenie tohto mesiaca (D-107). Posledné 3 dni (D-227, potvrdené zakladateľom). */
export const MONTH_END_WINDOW_DAYS = 3;

/** Blíži sa koniec mesiaca a vyhodnotenie za tento mesiac ešte nie je (D-107, D-227). Prvé vyhodnotenie rieši výzva (L6). */
export function monthEndApproaching(lastReviewIso: string | null, todayIso: string, windowDays = MONTH_END_WINDOW_DAYS): boolean {
  if (!lastReviewIso) return false;
  if (lastReviewIso.slice(0, 7) === todayIso.slice(0, 7)) return false;
  const [y, m, d] = todayIso.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d > lastDay - windowDays;
}

/** Záloha chýba viac ako 7 dní alebo nikdy (FR-19, D-035). */
export function backupOverdue(lastExportIso: string | null, todayIso: string, days = 7): boolean {
  if (!lastExportIso) return true;
  const a = Date.UTC(...(lastExportIso.slice(0, 10).split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(todayIso.split("-").map(Number) as [number, number, number]));
  return (b - a) / 86_400_000 > days;
}

/** Nastavenia sa nekontrolovali viac ako rok alebo nikdy (N-13, D-151). */
export function settingsCheckOverdue(checkedAtIso: string | undefined, todayIso: string, days = 365): boolean {
  if (!checkedAtIso) return true;
  return daysSince(checkedAtIso, todayIso) > days;
}

