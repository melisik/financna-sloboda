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
