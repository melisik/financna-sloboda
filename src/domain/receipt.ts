/**
 * Číslo pokladničného dokladu z QR kódu (D-126): písmená, číslice a pomlčky, 20 až 40 znakov.
 * Vzorka z portálu má 34 znakov; rozsah sa spresní podľa ďalších dokladov.
 */
const RECEIPT_ID = /^[A-Za-z0-9-]{20,40}$/;

/** Portál finančnej správy na overenie dokladu. Otvára ho používateľ, appka ho nevolá (D-126). */
export const RECEIPT_CHECK_URL = "https://opd.financnasprava.sk/#!/check";

export function isReceiptId(value: unknown): value is string {
  return typeof value === "string" && RECEIPT_ID.test(value);
}

/** Z textu QR kódu vráti číslo dokladu, alebo null, ak to nie je číslo dokladu. */
export function receiptIdFromQr(text: string): string | null {
  const trimmed = text.trim();
  return isReceiptId(trimmed) ? trimmed : null;
}
