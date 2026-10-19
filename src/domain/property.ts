import type { Property } from "../storage/types";

/** Čistá hodnota = odhad mínus zostatok hypotéky (D-080). Môže byť záporná. */
export function netPropertyValueCents(p: Property): number {
  return p.valueCents - p.mortgageBalanceCents;
}

/** Mesačné náklady nehnuteľnosti: splátka hypotéky plus ostatné náklady (nevyplnené = 0). */
export function monthlyCostsCents(p: Property): number {
  return (p.monthlyPaymentCents ?? 0) + (p.monthlyOtherCostsCents ?? 0);
}

/**
 * Počíta sa do K len pri prenájme (D-093: vlastné bývanie sa do K nepočíta).
 * Režim „nezadane“ sa do K nepočíta, kým ho používateľ nevyberie (predpoklad, návrh docs/11 bod 3).
 */
export function countsInCapital(p: Property): boolean {
  return p.mode === "prenajom";
}

/** Odhad je starší ako 12 mesiacov k dnešnému dňu (D-089); oba dátumy v tvare RRRR-MM-DD. */
export function valueIsStale(valueDate: string, today: string): boolean {
  const [y, m, d] = today.split("-").map(Number);
  const cutoff = `${String(y - 1).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return valueDate < cutoff;
}
