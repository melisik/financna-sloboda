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

/** Záloha chýba viac ako 7 dní alebo nikdy (FR-19, D-035). */
export function backupOverdue(lastExportIso: string | null, todayIso: string, days = 7): boolean {
  if (!lastExportIso) return true;
  const a = Date.UTC(...(lastExportIso.slice(0, 10).split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(todayIso.split("-").map(Number) as [number, number, number]));
  return (b - a) / 86_400_000 > days;
}

/** Počet dní od dátumu (YYYY-MM-DD alebo ISO) do dneška; 0 = dnes. */
export function daysSince(iso: string, todayIso: string): number {
  const a = Date.UTC(...(iso.slice(0, 10).split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(todayIso.split("-").map(Number) as [number, number, number]));
  return Math.round((b - a) / 86_400_000);
}
