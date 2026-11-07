import type { Property } from "./model/entities";
import { addMonths } from "./mortgage";

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

/**
 * Záznam o poslednej splátke sedí so súčasným zostatkom (D-347): zo zostatku po splátke vedie k nemu reťaz mimoriadnych
 * splátok, z ktorých každá začína presne na zostatku, kde predchádzajúca skončila (`balanceBeforeCents`).
 * Poradie v zozname ani rovnaký dátum nerozhodujú. Mimoriadne splátky pred pravidelnou splátkou do reťaze nenadväzujú
 * a zostanú bokom. Viac možných pokračovaní, prerušená reťaz alebo splátka nadväzujúca na súčasný zostatok = neplatný záznam.
 */
export function mortgagePaymentRecordValid(p: Property): boolean {
  const last = p.lastMortgagePayment;
  if (!last) return false;
  // Mimoriadna splátka sa dá zapísať len od dátumu zostatku, teda nie pred dátumom záznamu; staršie sa nemôžu napájať.
  const pending = (p.extraPayments ?? []).filter((e) => e.date >= last.date && e.balanceBeforeCents !== undefined);
  let running = last.balanceAfterCents;
  for (;;) {
    const next = pending.filter((e) => e.balanceBeforeCents === running);
    if (running === p.mortgageBalanceCents) return next.length === 0;
    if (next.length !== 1) return false;
    pending.splice(pending.indexOf(next[0]), 1);
    running = Math.max(0, running - next[0].amountCents);
  }
}

/**
 * Splátka hypotéky v mesiaci dňa `today` (D-347). Uložený zostatok je stav po poslednom výročí dátumu zostatku,
 * preto sa splátka, ktorá už v mesiaci prebehla, berie zo záznamu automatického splácania, nie zo zostatku.
 * 1. Záznam z tohto mesiaca, ktorý sedí so zostatkom (`mortgagePaymentRecordValid`): zaplatená suma.
 * 2. Splatená hypotéka: 0.
 * 3. Výročie ešte len príde v tomto mesiaci: splátka, najviac zostatok s úrokom (D-255).
 * 4. Inak (zostatok zadaný ručne, staršie dáta): zmluvná splátka.
 */
export function mortgagePaymentInMonthCents(p: Property, today: string): number {
  const month = today.slice(0, 7);
  const last = p.lastMortgagePayment;
  if (last && last.date.slice(0, 7) === month && mortgagePaymentRecordValid(p)) return last.amountCents;
  if (p.mortgageBalanceCents <= 0) return 0;
  const payment = p.monthlyPaymentCents ?? 0;
  if (p.balanceDate && addMonths(p.balanceDate, 1).slice(0, 7) === month) {
    return Math.min(payment, p.mortgageBalanceCents + splitPayment(p).interestCents);
  }
  return payment;
}

/**
 * Bývanie v rozpočte: splátky hypoték v mesiaci pri každom režime nehnuteľnosti (D-346, D-347).
 * Nájom sa od splátok neodpočítava (mení D-137); je to samostatný príjem z evidencie prenájmu.
 */
export function housingFlowCents(list: Property[], today: string): number {
  return list.reduce((sum, p) => sum + mortgagePaymentInMonthCents(p, today), 0);
}

/** Ručná zmena zostatku, dátumu zostatku, splátky alebo sadzby hypotéky (D-347). Prázdny dátum pri nulovom zostatku zmenou nie je. */
export function mortgageParamsChanged(prev: Property, next: Property): boolean {
  return (
    prev.mortgageBalanceCents !== next.mortgageBalanceCents ||
    (next.balanceDate !== undefined && next.balanceDate !== prev.balanceDate) ||
    (prev.monthlyPaymentCents ?? 0) !== (next.monthlyPaymentCents ?? 0) ||
    // Formulár ukazuje sadzbu v % a delí ju 100; rozdiel pod 1e-9 vzniká len zaokrúhlením.
    Math.abs((prev.mortgageRate ?? 0) - (next.mortgageRate ?? 0)) > 1e-9
  );
}

/**
 * Uloženie nehnuteľnosti z formulára (D-347): záznam o poslednej splátke sa prenesie len pri nezmenenej hypotéke, inak sa zmaže.
 * Mimoriadna splátka a jej vrátenie záznam nemenia; ich vplyv na zostatok overí `mortgagePaymentRecordValid`.
 */
export function withMortgagePaymentRecord(prev: Property | null, next: Property): Property {
  const { lastMortgagePayment: _ignored, ...rest } = next;
  if (!prev?.lastMortgagePayment || mortgageParamsChanged(prev, next)) return rest;
  return { ...rest, lastMortgagePayment: prev.lastMortgagePayment };
}

/** Plánovaný mesačný nájom z nastavenia nehnuteľností v prenájme. Len informácia; do skutočných príjmov sa nepočíta (D-346). */
export function plannedRentalIncomeInMonthCents(list: Property[]): number {
  return list.reduce((sum, p) => sum + (p.mode === "prenajom" ? p.monthlyRentCents ?? 0 : 0), 0);
}

/** Plánované ostatné mesačné náklady nehnuteľností v prenájme (odhad z formulára). Len informácia; do skutočných výdavkov sa nepočítajú (D-346). */
export function plannedRentalCostsInMonthCents(list: Property[]): number {
  return list.reduce((sum, p) => sum + (p.mode === "prenajom" ? p.monthlyOtherCostsCents ?? 0 : 0), 0);
}

/** Skutočne prijatý nájom v mesiaci dňa `today` podľa evidencie prenájmu (D-157, D-346). */
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

/** Skutočné výdavky na prenájom v mesiaci dňa `today` podľa evidencie prenájmu (D-157, D-346). */
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

