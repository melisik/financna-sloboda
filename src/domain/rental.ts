import type { RentalEntry } from "../storage/types";

/** Súčty z ročnej evidencie prenájmu (D-157): len podklad na daňové priznanie, nie daňový výpočet. */
export function rentalTotalsForYear(entries: RentalEntry[], year: number): { incomeCents: number; costsCents: number; count: number } {
  const prefix = `${year}-`;
  const inYear = entries.filter((e) => e.date.startsWith(prefix));
  return {
    incomeCents: inYear.filter((e) => e.kind === "prijem").reduce((sum, e) => sum + e.amountCents, 0),
    costsCents: inYear.filter((e) => e.kind === "vydavok").reduce((sum, e) => sum + e.amountCents, 0),
    count: inYear.length,
  };
}

/** Roky, v ktorých existuje aspoň jeden záznam, od najnovšieho. */
export function rentalYears(entries: RentalEntry[]): number[] {
  return [...new Set(entries.map((e) => Number(e.date.slice(0, 4))))].sort((a, b) => b - a);
}
