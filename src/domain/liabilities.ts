import type { Liability } from "../storage/types";

/** Mesačný úrok zo zostatku: zostatok × sadzba / 12, v centoch (D-085 pre záväzky). */
export function liabilityInterestCents(l: Liability): number {
  return Math.round((l.balanceCents * l.rate) / 12);
}

/** Súčty pre sekciu Záväzky: dlh, mesačný odtok a z neho úrok. */
export function liabilitiesTotals(list: Liability[]): { debtCents: number; monthlyPaymentCents: number; monthlyInterestCents: number } {
  return list.reduce(
    (t, l) => ({
      debtCents: t.debtCents + l.balanceCents,
      monthlyPaymentCents: t.monthlyPaymentCents + l.monthlyPaymentCents,
      monthlyInterestCents: t.monthlyInterestCents + liabilityInterestCents(l),
    }),
    { debtCents: 0, monthlyPaymentCents: 0, monthlyInterestCents: 0 },
  );
}

/** Záväzok je platný dnes: má zostatok a koniec (ak je) nie je v minulosti (D-140). */
export function liabilityIsActive(l: Liability, today: string): boolean {
  return l.balanceCents > 0 && (l.endDate === undefined || l.endDate >= today);
}

/** Mesačné splátky platných záväzkov v centoch; do nevyhnutných výdavkov v prehľade (D-140). */
export function activeLiabilityPaymentCents(list: Liability[], today: string): number {
  return list.filter((l) => liabilityIsActive(l, today)).reduce((sum, l) => sum + l.monthlyPaymentCents, 0);
}

