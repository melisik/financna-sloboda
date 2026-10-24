import type { Capital } from "./capital";
import { targetDate } from "./goal";
import { goalMonths, type Rental } from "./rentalGoal";

/** Horizont zobrazenia dátumu cieľa: 50 rokov (O-5, GC-12), rovnako ako v `goalDisplay`. */
const HORIZON_MONTHS = 600;

export interface GoalProgress {
  haveCents: number;
  targetCents: number;
  /** Celé percentá nadol, medzi 0 a 100: 100 % sa ukáže až pri dosiahnutí cieľa. */
  percent: number;
}

/**
 * Pokrok k cieľovej sume (D-283). Kapitál je ten istý ako pri dátume cieľa: investície, hotovosť
 * a nehnuteľnosti v prenájme hodnotou mínus zostatok hypotéky (K_L v mesiaci 0, `monthsToTargetWithRentals`).
 */
export function goalProgress(c: Capital, targetCents: number, rentals: Rental[]): GoalProgress {
  const haveCents = c.inv + c.cash + rentals.reduce((s, r) => s + r.valueCents - r.mortgageBalanceCents, 0);
  const percent = targetCents <= 0 ? 100 : Math.min(100, Math.max(0, Math.floor((100 * haveCents) / targetCents)));
  return { haveCents, targetCents, percent };
}

/** Kladné mesiace = dátum cieľa je bližšie ako pri predchádzajúcom vyhodnotení. */
export interface GoalDateShift {
  months: number;
  since: string;
}

const monthIndex = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
};

/**
 * Posun dátumu cieľa od predchádzajúceho vyhodnotenia (D-283). Oba dátumy sa počítajú s dnešnými
 * nastaveniami a nehnuteľnosťami, takže posun ukazuje len zmenu kapitálu. Bez predchádzajúceho
 * vyhodnotenia, pri nedosiahnuteľnom, dosiahnutom alebo vzdialenejšom ako 50 rokov cieli vráti null.
 */
export function goalDateShift(p: {
  previous: { date: string; investmentsCents: number; cashCents: number } | null;
  latestDate: string;
  capital: Capital;
  mInv: number;
  mCash: number;
  rate: number;
  targetCents: number;
  rentals: Rental[];
}): GoalDateShift | null {
  if (!p.previous) return null;
  const before = goalMonths({ inv: p.previous.investmentsCents, cash: p.previous.cashCents }, p.mInv, p.mCash, p.rate, p.targetCents, p.rentals);
  const now = goalMonths(p.capital, p.mInv, p.mCash, p.rate, p.targetCents, p.rentals);
  if (before.kind !== "months" || now.kind !== "months") return null;
  const usable = (n: number) => Number.isFinite(n) && n > 0 && n <= HORIZON_MONTHS;
  if (!usable(before.months) || !usable(now.months)) return null;
  const months = monthIndex(targetDate(p.previous.date, before.months)) - monthIndex(targetDate(p.latestDate, now.months));
  return { months, since: p.previous.date };
}
