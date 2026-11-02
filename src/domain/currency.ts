/** Multi-currency podpora (D-340). Základná mena je EUR. Kurzy zadáva používateľ ručne (D-009). */

/**
 * Prepočet cudzej meny na EUR.
 * @param originalCents – suma v cudzej mene (centy)
 * @param ratePerEur    – koľko jednotiek cudzej meny = 1 EUR (napr. USD: 1.05)
 */
export function convertToBase(originalCents: number, ratePerEur: number): number {
  if (ratePerEur <= 0) throw new RangeError("ratePerEur musí byť kladné číslo");
  return Math.round(originalCents / ratePerEur);
}

/** Predvolená základná mena (D-340). */
export const BASE_CURRENCY = "EUR";
