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
 * Rozdelenie splátky na úrok a istinu (FR-22, D-085). Úrok je z aktuálneho zostatku za mesiac.
 * Istina môže byť záporná, ak splátka nepokrýva úrok; vtedy zostatok rastie (zobrazí sa upozornenie).
 */
export function splitPayment(p: Property): { interestCents: number; principalCents: number } {
  const rate = p.mortgageRate ?? 0;
  const interestCents = Math.round((p.mortgageBalanceCents * rate) / 12);
  const payment = p.monthlyPaymentCents ?? 0;
  return { interestCents, principalCents: payment - interestCents };
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

/** Bývanie v rozpočte (D-137): splátky hypoték mínus nájom z prenajímaných nehnuteľností. */
export function housingFlowCents(list: Property[]): number {
  return list.reduce((sum, p) => {
    const payment = p.mortgageBalanceCents > 0 ? p.monthlyPaymentCents ?? 0 : 0;
    const rent = p.mode === "prenajom" ? p.monthlyRentCents ?? 0 : 0;
    return sum + payment - rent;
  }, 0);
}

/** Zmenila sa nehnuteľnosť počítaná do K (prenájom) po danom čase? Upozornenie pri vyhodnotení (D-137). */
export function propertyChangedSince(list: Property[], isoTime: string): boolean {
  return list.some((p) => p.mode === "prenajom" && p.updatedAt > isoTime);
}

