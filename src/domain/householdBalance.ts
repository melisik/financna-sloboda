import type { Budget, Liability, Property, RecurringExpense, RegularIncome, Transaction } from "./model/entities";
import { monthlyIncomeCents } from "./income";
import { monthSummary } from "./monthSummary";
import { mortgagePaymentInMonthCents, plannedRentalCostsInMonthCents, plannedRentalIncomeInMonthCents } from "./property";
import { isRecurringInMonth, MATCH_TOLERANCE_CENTS, monthlyShareCents } from "./recurring";

export interface HouseholdMonthInput {
  transactions: Transaction[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  properties: Property[];
  liabilities: Liability[];
  incomes: RegularIncome[];
}

/**
 * Mesačná bilancia domácnosti (D-346): príjmy a výdavky oddelene, každá položka presne raz.
 * Plánovaný nájom a plánované náklady prenájmu sú len informácia a do súčtov sa nepočítajú.
 */
export function householdMonthBalance(d: HouseholdMonthInput, today: string, thresholdCents = 0) {
  const summary = monthSummary(d.transactions, d.budgets, d.recurringExpenses, today, thresholdCents, d.properties, d.liabilities);
  const categorizedCents = summary.byNecessity.nevyhnutne + summary.byNecessity.nie_nevyhnutne + summary.byNecessity.ostatne + summary.unassignedCents;
  const regularIncomeCents = monthlyIncomeCents(d.incomes, today);
  const totalIncomeCents = regularIncomeCents + summary.rentalIncomeCents;
  const totalExpensesCents = categorizedCents + summary.rentalExpensesCents;
  return {
    summary,
    regularIncomeCents,
    rentalIncomeCents: summary.rentalIncomeCents,
    totalIncomeCents,
    housingCents: summary.housingCents,
    liabilitiesCents: summary.liabilitiesCents,
    rentalExpensesCents: summary.rentalExpensesCents,
    otherExpensesCents: categorizedCents - summary.housingCents - summary.liabilitiesCents,
    totalExpensesCents,
    balanceCents: totalIncomeCents - totalExpensesCents,
    plannedRentCents: plannedRentalIncomeInMonthCents(d.properties),
    plannedRentalCostsCents: plannedRentalCostsInMonthCents(d.properties),
  };
}

export type DoubleEntryHint =
  | { kind: "hypoteka_pravidelny"; name: string; amountCents: number }
  | { kind: "hypoteka_transakcia"; date: string; amountCents: number }
  | { kind: "prenajom_transakcia"; date: string; amountCents: number };

/**
 * Možný dvojitý zápis v mesiaci (D-346): splátka hypotéky sa počíta z Majetku a výdavky prenájmu z evidencie prenájmu.
 * Zhoda je len podľa sumy (±1 €, ako D-299), preto slúži iba na upozornenie; nič sa nevynecháva ani nemaže.
 */
export function possibleDoubleEntries(d: Pick<HouseholdMonthInput, "transactions" | "recurringExpenses" | "properties">, today: string): DoubleEntryHint[] {
  const month = today.slice(0, 7);
  const near = (a: number, b: number) => Math.abs(a - b) <= MATCH_TOLERANCE_CENTS;
  const payments = d.properties.map((p) => mortgagePaymentInMonthCents(p, today)).filter((c) => c > 0);
  const expenses = d.transactions.filter((t) => t.type === "vydavok" && t.date.slice(0, 7) === month);
  const ledgerCosts = d.properties
    .filter((p) => p.mode === "prenajom")
    .flatMap((p) => (p.rentalLedger ?? []).filter((e) => e.kind === "vydavok" && e.date.slice(0, 7) === month));

  const out: DoubleEntryHint[] = [];
  for (const e of d.recurringExpenses) {
    const share = monthlyShareCents(e);
    if (e.category === "bývanie" && isRecurringInMonth(e, today) && payments.some((p) => near(p, share))) {
      out.push({ kind: "hypoteka_pravidelny", name: e.name, amountCents: share });
    }
  }
  for (const t of expenses) {
    if (t.category === "bývanie" && payments.some((p) => near(p, t.amountCents))) {
      out.push({ kind: "hypoteka_transakcia", date: t.date, amountCents: t.amountCents });
    } else if (ledgerCosts.some((e) => near(e.amountCents, t.amountCents))) {
      out.push({ kind: "prenajom_transakcia", date: t.date, amountCents: t.amountCents });
    }
  }
  return out;
}
