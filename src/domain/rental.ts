import type { RentalEntry } from "./model/entities";

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

/** Nezdaniteľná suma z príjmov z prenájmu nehnuteľností podľa § 9 ods. 1 písm. g) zákona (poučenie k DP FO 2025, s. 13). */
const RENTAL_EXEMPTION_CENTS = 50_000;

/**
 * Riadok 11 tabuľky 1 (oddiel VI) daňového priznania typ B (poučenie k DP FO 2025, s. 13).
 * Stĺpec 1: kladný rozdiel príjmu z prenájmu a 500 €. Stĺpec 2: výdavky v rovnakom pomere ako stĺpec 1 ÷ príjem.
 * Počíta sa z celkových príjmov a výdavkov zo všetkých nehnuteľností v prenájme (jedna suma 500 €).
 * Podklad na overenie, nie konečné číslo daňového priznania.
 */
export function rentalRow11(incomeCents: number, costsCents: number): { col1Cents: number; col2Cents: number } {
  const col1 = Math.max(0, incomeCents - RENTAL_EXEMPTION_CENTS);
  const col2 = incomeCents > 0 ? Math.round((costsCents * col1) / incomeCents) : 0;
  return { col1Cents: col1, col2Cents: col2 };
}
