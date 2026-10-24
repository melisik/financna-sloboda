import type { Property } from "./model/entities";
import { countsInCapital } from "./property";
import { RETURN_ASSUMPTIONS } from "./assumptions";
import { monthsToTargetSplit, type Capital } from "./capital";
import { monthlyRate } from "./goal";

/**
 * Nájomná nehnuteľnosť v K (FR-02a, D-080, D-081, D-084, D-085). Sumy v centoch.
 * netRentCents = nájom mínus ostatné náklady (predpoklad: ostatné náklady znižujú čistý nájom).
 */
export interface Rental {
  valueCents: number; // V: odhad hodnoty
  mortgageBalanceCents: number; // Z0: zostatok hypotéky
  mortgageRate: number; // nominálna úroková sadzba p. a.
  paymentCents: number; // P: aktuálna splátka podľa zmluvy (D-084)
  netRentCents: number; // N: čistý nájom
}

/** Výsledok výpočtu mesiacov do cieľa. cash_exhausted = hotovosť by klesla pod 0 (FR-02a, D-058). */
type GoalMonths =
  | { kind: "months"; months: number }
  | { kind: "unreachable" }
  | { kind: "cash_exhausted"; month: number };

/** Horizont FR-02a: 50 rokov (O-5). */
const RENTAL_HORIZON_MONTHS = 600;

/** Do K sa počíta len prenájom (D-093 a countsInCapital). */
export function rentalsFor(properties: Property[]): Rental[] {
  return properties.filter(countsInCapital).map((p) => ({
    valueCents: p.valueCents,
    mortgageBalanceCents: p.mortgageBalanceCents,
    mortgageRate: p.mortgageRate ?? 0,
    paymentCents: p.monthlyPaymentCents ?? 0,
    netRentCents: (p.monthlyRentCents ?? 0) - (p.monthlyOtherCostsCents ?? 0),
  }));
}

/** Mesačná reálna sadzba hypotéky i_h = ((1 + nominálna) / (1 + π))^(1/12) − 1 (FR-02a, A2). */
function mortgageMonthlyRate(r: Rental): number {
  return Math.pow((1 + r.mortgageRate) / (1 + RETURN_ASSUMPTIONS.inflation), 1 / 12) - 1;
}

/**
 * Mesiace do cieľa s nehnuteľnosťami v K (FR-02a). Iteruje po mesiacoch od D_L.
 * K_L(k) = K_inv(k) + K_cash(k) + Σ(V − B_j(k)); B_j je zostatok hypotéky j-tej nehnuteľnosti.
 * Splátka P sa platí len do splatenia; posledná je zmenšená na zostatok a po splatení ide do m čistý nájom N (D-087, nález T1).
 * K_cash(k) = K_cash(k−1) + m_cash + Σ(N − p_j(k)), kde p_j(k) je splátka j-tej nehnuteľnosti v mesiaci k.
 * Najprv sa kontroluje hotovosť (K_cash(k) ≥ 0), potom cieľ; zlomok je lineárna interpolácia (D-046).
 */
export function monthsToTargetWithRentals(
  c: Capital,
  mInv: number,
  mCash: number,
  annualRate: number,
  targetCents: number,
  rentals: Rental[],
): GoalMonths {
  const i = monthlyRate(annualRate);
  const ihs = rentals.map(mortgageMonthlyRate);
  const balances = rentals.map((r) => r.mortgageBalanceCents);
  let kCash = c.cash;

  const at = (k: number) => {
    const g = Math.pow(1 + i, k);
    const kInv = c.inv * g + (i > 0 ? (mInv * (g - 1)) / i : mInv * k);
    const kNem = rentals.reduce((s, r, j) => s + r.valueCents - balances[j], 0);
    return { total: kInv + kCash + kNem, kCash };
  };

  let prev = at(0);
  for (let k = 0; k <= RENTAL_HORIZON_MONTHS; k++) {
    if (k > 0) {
      kCash += mCash;
      rentals.forEach((r, j) => {
        const owed = balances[j];
        const payment = owed > 0 ? Math.min(r.paymentCents, owed * (1 + ihs[j])) : 0;
        balances[j] = owed > 0 ? owed * (1 + ihs[j]) - payment : 0;
        kCash += r.netRentCents - payment;
      });
    }
    const cur = at(k);
    if (cur.kCash < 0) return { kind: "cash_exhausted", month: k };
    if (cur.total >= targetCents) {
      if (k === 0) return { kind: "months", months: 0 };
      return { kind: "months", months: k - 1 + (targetCents - prev.total) / (cur.total - prev.total) };
    }
    prev = cur;
  }
  return { kind: "unreachable" };
}

/** Mesiace do cieľa: bez nehnuteľností cesta MVP (monthsToTargetSplit), s nimi FR-02a. */
export function goalMonths(
  c: Capital,
  mInv: number,
  mCash: number,
  annualRate: number,
  targetCents: number,
  rentals: Rental[],
): GoalMonths {
  if (rentals.length === 0) {
    const n = monthsToTargetSplit(c, mInv, mCash, annualRate, targetCents);
    return n === null ? { kind: "unreachable" } : { kind: "months", months: n };
  }
  return monthsToTargetWithRentals(c, mInv, mCash, annualRate, targetCents, rentals);
}

/**
 * Výsledok predbežného dopadu (FR-04). cash_exhausted: hotovosť klesne pod 0 pred alebo po transakcii
 * (side); dopad sa nedá vyčísliť, lebo dátum neexistuje (FR-02a).
 */
export type Impact =
  | { kind: "delta"; months: number }
  | { kind: "cash_exhausted"; side: "before" | "after"; month: number }
  | { kind: "unreachable" };

/** Predbežný dopad (FR-04): n(before) − n(after), kladné = cieľ bližšie. */
export function impactWithRentals(
  before: Capital,
  after: Capital,
  mInv: number,
  mCash: number,
  annualRate: number,
  targetCents: number,
  rentals: Rental[],
): Impact {
  const b = goalMonths(before, mInv, mCash, annualRate, targetCents, rentals);
  const a = goalMonths(after, mInv, mCash, annualRate, targetCents, rentals);
  if (a.kind === "cash_exhausted") return { kind: "cash_exhausted", side: "after", month: a.month };
  if (b.kind === "cash_exhausted") return { kind: "cash_exhausted", side: "before", month: b.month };
  if (b.kind !== "months" || a.kind !== "months") return { kind: "unreachable" };
  return { kind: "delta", months: b.months - a.months };
}
