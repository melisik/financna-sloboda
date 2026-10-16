import { monthlyRate } from "./goal";

/**
 * Počet mesiacov do cieľa s nehnuteľnosťou (FR-02a, Fáza 2, D-080, D-092, D-093).
 * Sumy v centoch; r je ročná reálna sadzba (0,035 = 3,5 %); iH je reálna mesačná úroková sadzba hypotéky.
 * K_L(k) = K_inv(k) + K_cash(k) + K_nem(k), k = mesiace od D_L:
 *   K_inv(k)  = K_inv·(1+i)^k + m_inv·((1+i)^k − 1)/i
 *   K_cash(k) = K_cash + (m_cash + N − P)·k
 *   K_nem(k)  = V − Z(k), Z(k) = Z0·(1+iH)^k − P·((1+iH)^k − 1)/iH
 * Dátum: najmenšie k s K_L(k) ≥ T, zlomok lineárne interpolovaný (D-046).
 * Ak K_cash(k) < 0 pred dosiahnutím cieľa, výpočet sa zastaví (D-058, D-074).
 */

export type PropertyInput = {
  kInvCents: number;
  kCashCents: number;
  mInvCents: number;
  mCashCents: number;
  annualRate: number;
  targetCents: number;
  propertyValueCents: number;
  mortgageBalanceCents: number;
  monthlyPaymentCents: number;
  monthlyNetRentCents: number;
  monthlyMortgageRate: number;
};

export type PropertyResult =
  | { kind: "months"; months: number }
  | { kind: "unreachable" }
  | { kind: "blocked"; month: number };

/** Horizont FR-02a: 50 rokov (O-5). */
export const MAX_MONTHS = 600;

export function monthsToTargetWithProperty(input: PropertyInput): PropertyResult {
  const i = monthlyRate(input.annualRate);
  const { mInvCents: mInv, mCashCents: mCash } = input;
  const P = input.monthlyPaymentCents;
  const N = input.monthlyNetRentCents;
  const iH = input.monthlyMortgageRate;

  const growth = (k: number) => Math.pow(1 + i, k);
  const mortgageGrowth = (k: number) => Math.pow(1 + iH, k);

  const invested = (k: number) =>
    input.kInvCents * growth(k) + (i === 0 ? mInv * k : (mInv * (growth(k) - 1)) / i);
  const cash = (k: number) => input.kCashCents + (mCash + N - P) * k;
  const balance = (k: number) =>
    iH === 0
      ? input.mortgageBalanceCents - P * k
      : input.mortgageBalanceCents * mortgageGrowth(k) - (P * (mortgageGrowth(k) - 1)) / iH;
  const totalCapital = (k: number) => invested(k) + cash(k) + (input.propertyValueCents - balance(k));

  if (totalCapital(0) >= input.targetCents) return { kind: "months", months: 0 };

  for (let k = 1; k <= MAX_MONTHS; k++) {
    if (cash(k) < 0) return { kind: "blocked", month: k };
    const reached = totalCapital(k);
    if (reached >= input.targetCents) {
      const before = totalCapital(k - 1);
      return { kind: "months", months: k - 1 + (input.targetCents - before) / (reached - before) };
    }
  }
  return { kind: "unreachable" };
}
