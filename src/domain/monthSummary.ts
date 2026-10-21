import type { Budget, BudgetCategory, Liability, Property, RecurringExpense, Transaction } from "../storage/types";
import { activeLiabilityPaymentCents } from "./liabilities";
import { spentInMonthCents } from "./budget";
import { housingFlowCents } from "./property";
import { monthlyRecurringByCategory } from "./recurring";

/** Zatriedenie výdavku: nevyhnutný, nie nevyhnutný, alebo ostatný (iné). Návrh na potvrdenie (D-131). */
export type Necessity = "nevyhnutne" | "nie_nevyhnutne" | "ostatne";

export const NECESSITY: Record<BudgetCategory, Necessity> = {
  "bývanie": "nevyhnutne",
  "dom a energie": "nevyhnutne",
  "jedlo": "nevyhnutne",
  "doprava": "nevyhnutne",
  "zdravie": "nevyhnutne",
  "deti a vzdelávanie": "nevyhnutne",
  "oblečenie": "nie_nevyhnutne",
  "zábava": "nie_nevyhnutne",
  "voľný čas a dovolenka": "nie_nevyhnutne",
  "predplatné a služby": "nie_nevyhnutne",
  "dôchodok": "nevyhnutne",
  "iné": "ostatne",
};

export interface MonthSummary {
  planCents: number; // súčet limitov z Rozpočtu
  plannedSpentCents: number; // minuté v kategóriách, ktoré majú limit
  percent: number | null; // plnenie plánu v %; null, ak plán nie je
  byNecessity: Record<Necessity, number>; // minuté v zatriedených kategóriách vrátane pravidelných
  unassignedCents: number; // výdavky bez kategórie
  overThresholdCount: number; // výdavky tohto mesiaca nad prahom
  liabilitiesCents: number; // splátky platných úverov a kariet (sú v nevyhnutných)
}

/** Mesačný prehľad výdavkov pre Prehľad: plnenie plánu a rozpis podľa nevyhnutnosti (D-131). */
export function monthSummary(
  transactions: Transaction[],
  budgets: Budget[],
  recurring: RecurringExpense[],
  today: string,
  thresholdCents: number,
  properties: Property[] = [],
  liabilities: Liability[] = [],
): MonthSummary {
  const recurringByCat = monthlyRecurringByCategory(recurring, today);
  const housing = housingFlowCents(properties);
  const spentIn = (c: BudgetCategory) =>
    spentInMonthCents(transactions, c, today) + (recurringByCat[c] ?? 0) + (c === "bývanie" ? housing : 0);

  const byNecessity: Record<Necessity, number> = { nevyhnutne: 0, nie_nevyhnutne: 0, ostatne: 0 };
  for (const c of Object.keys(NECESSITY) as BudgetCategory[]) byNecessity[NECESSITY[c]] += spentIn(c);
  const liabilitiesCents = activeLiabilityPaymentCents(liabilities, today);
  byNecessity.nevyhnutne += liabilitiesCents;

  const planCents = budgets.reduce((sum, b) => sum + b.limitCents, 0);
  const plannedSpentCents = budgets.reduce((sum, b) => sum + spentIn(b.category), 0);
  const month = today.slice(0, 7);
  const overThresholdCount = transactions.filter(
    (t) => t.type === "vydavok" && t.date.slice(0, 7) === month && t.amountCents >= thresholdCents,
  ).length;

  return {
    planCents,
    plannedSpentCents,
    percent: planCents > 0 ? Math.round((plannedSpentCents / planCents) * 100) : null,
    byNecessity,
    unassignedCents: spentInMonthCents(transactions, null, today),
    liabilitiesCents,
    overThresholdCount,
  };
}
