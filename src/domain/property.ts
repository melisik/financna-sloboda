import type { Property } from "./model/entities";

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
 * Režim "nezadane" sa do K nepočíta, kým ho používateľ nevyberie (predpoklad, návrh docs/11 bod 3).
 * Režim "iny_uccel" sa do K nepočíta (C1).
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

/**
 * Bývanie v rozpočte (D-137): splátky hypoték (len pri vlastnom bývaní, alebo pri prenájme so splátkami).
 * OPRAVA A1: Splátky hypotéky sú výdavky, nájom je príjem - počítajú sa oddelene.
 */
export function housingFlowCents(list: Property[]): number {
  return list.reduce((sum, p) => {
    const payment = p.mortgageBalanceCents > 0 ? p.monthlyPaymentCents ?? 0 : 0;
    const rent = p.mode === "prenajom" ? p.monthlyRentCents ?? 0 : 0;
    return sum + payment - rent;
  }, 0);
}

/**
 * Plánovaný mesačný príjem z prenájmu (pred faktickými záznamami v rentalLedger).
 * NOVÉ A1: Oddelená funkcia pre príjmy z prenájmu.
 */
export function plannedRentalIncomeInMonthCents(list: Property[]): number {
  return list.reduce((sum, p) => {
    const rent = p.mode === "prenajom" ? p.monthlyRentCents ?? 0 : 0;
    return sum + rent;
  }, 0);
}

/**
 * Faktické príjmy z prenájmu za mesiac z ledger záznamov.
 * NOVÉ A1: Oddelená funkcia pre skutočné príjmy z prenájmu.
 */
export function rentalIncomeInMonthCents(list: Property[], today: string): number {
  const month = today.slice(0, 7);
  return list.reduce((sum, p) => {
    if (p.mode !== "prenajom" || !p.rentalLedger) return sum;
    const income = p.rentalLedger
      .filter((e) => e.kind === "prijem" && e.date.slice(0, 7) === month)
      .reduce((s, e) => s + e.amountCents, 0);
    return sum + income;
  }, 0);
}

/**
 * Faktické výdavky z prenájmu za mesiac z ledger záznamov (údržba, poistenie, ...).
 * NOVÉ A1: Oddelená funkcia pre výdavky na prenájom z ledger.
 */
export function rentalExpensesInMonthCents(list: Property[], today: string): number {
  const month = today.slice(0, 7);
  return list.reduce((sum, p) => {
    if (p.mode !== "prenajom" || !p.rentalLedger) return sum;
    const expenses = p.rentalLedger
      .filter((e) => e.kind === "vydavok" && e.date.slice(0, 7) === month)
      .reduce((s, e) => s + e.amountCents, 0);
    return sum + expenses;
  }, 0);
}

/** Zmenila sa nehnuteľnosť počítaná do K (prenájom) po danom čase? Upozornenie pri vyhodnotení (D-137). */
export function propertyChangedSince(list: Property[], isoTime: string): boolean {
  return list.some((p) => p.mode === "prenajom" && p.updatedAt > isoTime);
}

