/**
 * Cieľová suma (FR-01): T = V / p.
 * Sumy sú v centoch (05 §4); p je ročná miera výberu ako desatinné číslo (0,04 = 4 %).
 */
export function targetAmountCents(annualExpensesCents: number, withdrawalRate: number): number {
  if (!(annualExpensesCents > 0) || !(withdrawalRate > 0)) {
    throw new RangeError("Ročné výdavky aj miera výberu musia byť kladné (FR-01).");
  }
  return Math.round(annualExpensesCents / withdrawalRate);
}
