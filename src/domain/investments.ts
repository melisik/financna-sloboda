import type { Position } from "../storage/types";

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
