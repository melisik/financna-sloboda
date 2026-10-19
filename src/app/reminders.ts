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

/**
 * Blíži sa koniec mesiaca a vyhodnotenie v tomto mesiaci ešte nie je (D-107).
 * Platí pre posledné tri dni mesiaca; ak je vyhodnotenie z tohto mesiaca, pripomienka sa nezobrazí.
 */
export function reviewDueSoon(lastReviewIso: string | null, todayIso: string, lastDays = 3): boolean {
  if (!lastReviewIso) return false;
  const [y, m, d] = todayIso.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  if (d <= daysInMonth - lastDays) return false;
  return lastReviewIso.slice(0, 7) !== todayIso.slice(0, 7);
}

/** Záloha chýba viac ako 7 dní alebo nikdy (FR-19, D-035). */
export function backupOverdue(lastExportIso: string | null, todayIso: string, days = 7): boolean {
  if (!lastExportIso) return true;
  const a = Date.UTC(...(lastExportIso.slice(0, 10).split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(todayIso.split("-").map(Number) as [number, number, number]));
  return (b - a) / 86_400_000 > days;
}
