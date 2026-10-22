import type { Position } from "./model/entities";
import { fullMonthsBetween } from "./dates";

/** Hodnota položky v centoch: počet × cena × kurz k euru (D-101). */
export function positionValueCents(p: Position): number {
  return Math.round(p.quantity * p.unitPrice * p.fxToEur * 100);
}

/** Súčet mesačných vkladov do tretieho piliera a iných položiek v centoch. Len na zobrazenie (D-105). */
export function monthlyContributionsTotalCents(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + (p.monthlyContributionCents ?? 0), 0);
}

/** Súčet všetkých položiek v centoch. Vyhodnotenie ho použije ako investície (D-101). */
export function investmentsTotalCents(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + positionValueCents(p), 0);
}

/** Súčet hodnoty v centoch podľa druhu položky (rozpis pri súhrne investícií). */
export function investmentsByKindCents(positions: Position[]): Partial<Record<Position["kind"], number>> {
  const out: Partial<Record<Position["kind"], number>> = {};
  for (const p of positions) out[p.kind] = (out[p.kind] ?? 0) + positionValueCents(p);
  return out;
}

/** Zmenila sa položka po danom čase? Upozornenie pri vyhodnotení, lebo suma investícií sa z nej odvodzuje (D-101). */
export function positionsChangedSince(positions: Position[], isoTime: string): boolean {
  return positions.some((p) => p.updatedAt > isoTime);
}

/** Názvy položiek, ktorých ocenenie je staršie ako daný počet mesiacov (N-16, schválené 3 mesiace). */
export function staleValuationNames(positions: Position[], today: string, months = 3): string[] {
  return positions.filter((p) => fullMonthsBetween(p.valueDate, today) >= months).map((p) => p.name);
}
