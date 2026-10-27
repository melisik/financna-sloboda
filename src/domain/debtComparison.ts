/**
 * Matematické porovnanie: splácanie hypotéky vs. investovanie (D-342).
 * TOTO NIE JE FINANČNÉ PORADENSTVO. Výsledok je číselné porovnanie, nie pokyn.
 */

export interface DebtVsInvestComparison {
  mortgageRate: number; // úroková sadzba hypotéky (napr. 0.04 = 4 %)
  expectedNetReturn: number; // očakávaný čistý výnos investícií (po dani a poplatkoch)
  difference: number; // expectedNetReturn − mortgageRate (kladné = investícia výhodnejšia)
  margin: "high" | "medium" | "low"; // šírka rozdielu: > 2 % = high, 1–2 % = medium, < 1 % = low
}

/**
 * Porovná úrokovú sadzbu hypotéky s očakávaným výnosom investície.
 * @param mortgageRate      – ročná sadzba hypotéky (napr. 0.04)
 * @param expectedNetReturn – čistý ročný výnos po dani a poplatkoch (napr. 0.035)
 */
export function compareDebtVsInvest(mortgageRate: number, expectedNetReturn: number): DebtVsInvestComparison {
  const difference = expectedNetReturn - mortgageRate;
  const abs = Math.abs(difference);
  const margin: DebtVsInvestComparison["margin"] = abs > 0.02 ? "high" : abs >= 0.01 ? "medium" : "low";
  return { mortgageRate, expectedNetReturn, difference, margin };
}
