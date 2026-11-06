/** Míľniky (D-344): informatívne oslavy pokroku – nie finančné odporúčania. */

export type MilestoneId = "first_1k" | "first_10k" | "halfway_there" | "expenses_covered_1w";

export interface Milestone {
  id: MilestoneId;
  label: string;
  reached: boolean;
}

/**
 * Vyhodnotí míľniky na základe aktuálneho kapitálu a cieľového kapitálu.
 * @param capitalCents   – celkový kapitál (investície + hotovosť) v centoch
 * @param targetCents    – cieľový kapitál (expensesCents / withdrawalRate) v centoch
 * @param weeklyExpensesCents – týždenné výdavky v centoch (expensesCents / 52)
 */
export function evaluateMilestones(
  capitalCents: number,
  targetCents: number,
  weeklyExpensesCents: number,
): Milestone[] {
  return [
    {
      id: "first_1k",
      label: "Prvých 1 000 €",
      reached: capitalCents >= 100_000, // 1 000 € v centoch
    },
    {
      id: "first_10k",
      label: "Prvých 10 000 €",
      reached: capitalCents >= 1_000_000, // 10 000 € v centoch
    },
    {
      id: "halfway_there",
      label: "Na pol ceste",
      reached: targetCents > 0 && capitalCents >= targetCents / 2,
    },
    {
      id: "expenses_covered_1w",
      label: "Pokryté výdavky na 1 týždeň",
      reached: weeklyExpensesCents > 0 && capitalCents >= weeklyExpensesCents,
    },
  ];
}
