import type { Settings } from "../storage/types";

/**
 * Východiskové hodnoty parametrov (D-061) (FR-13, UR-02, D-011, D-043, D-049, D-050).
 * Východisková hodnota je len štartovací predpoklad; používateľ ho môže kedykoľvek zmeniť.
 * Ročné výdavky sa nedajú odvodiť: zadáva ich používateľ (D-013).
 */
export function recommendedReserveCents(expensesCents: number, months = 3): number {
  return Math.round((expensesCents * months) / 12);
}

export function recommendedSettings(expensesCents: number): Settings {
  return {
    expensesCents,
    withdrawalRate: 0.037, // D-049
    realReturn: 0.035, // D-050
    reserveCents: recommendedReserveCents(expensesCents), // 3 mesiace výdavkov (D-011)
    thresholdCents: 10_000, // 100 € (D-048)
  };
}
