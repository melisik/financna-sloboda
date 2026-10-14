/**
 * Pripomienky (FR-10, FR-19, D-016, D-035). Čisté funkcie, bez času v pozadí.
 * Pripomienka je jemná: nič sa automaticky nemení ani nevynucuje.
 */

/** Vyhodnotenie za predchádzajúci mesiac chýba (FR-10): posledné je v inom, staršom mesiaci. */
export function reviewOverdue(lastReviewIso: string | null, todayIso: string): boolean {
  if (!lastReviewIso) return false; // prvé vyhodnotenie sa rieši výzvou v prvom nastavení (L6)
  return todayIso.slice(0, 7) > lastReviewIso.slice(0, 7);
}

/** Záloha chýba viac ako 7 dní alebo nikdy (FR-19, D-035). */
export function backupOverdue(lastExportIso: string | null, todayIso: string, days = 7): boolean {
  if (!lastExportIso) return true;
  const a = Date.UTC(...(lastExportIso.slice(0, 10).split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(todayIso.split("-").map(Number) as [number, number, number]));
  return (b - a) / 86_400_000 > days;
}
