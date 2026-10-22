/**
 * Pomocné funkcie pre dátumy v tvare RRRR-MM-DD. Zdieľané moduly ich používajú bez závislosti
 * na sebe navzájom (D-162, krok 1 architektúry).
 */

/** Plné mesiace od dátumu from do dátumu to (oba RRRR-MM-DD). Neskorší deň v mesiaci musí byť dosiahnutý. */
export function fullMonthsBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  let months = ty * 12 + tm - (fy * 12 + fm);
  if (td < fd) months -= 1;
  return Math.max(0, months);
}

/** Počet dní od dátumu (YYYY-MM-DD alebo ISO) do dneška; 0 = dnes. */
export function daysSince(iso: string, todayIso: string): number {
  const a = Date.UTC(...(iso.slice(0, 10).split("-").map(Number) as [number, number, number]));
  const b = Date.UTC(...(todayIso.split("-").map(Number) as [number, number, number]));
  return Math.round((b - a) / 86_400_000);
}
