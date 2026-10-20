import type { BudgetCategory, Transaction, TransactionType } from "../storage/types";

export interface HistoryFilter {
  type?: TransactionType; // undefined = všetky typy
  from?: string; // YYYY-MM-DD, vrátane
  to?: string; // YYYY-MM-DD, vrátane
  category?: BudgetCategory | "none"; // undefined = všetky; "none" = nezaradené
}

/** Filter a zoradenie od najnovšej (FR-15). */
export function filterHistory(transactions: Transaction[], f: HistoryFilter): Transaction[] {
  return transactions
    .filter((t) => (f.type ? t.type === f.type : true))
    .filter((t) => (f.from ? t.date >= f.from : true))
    .filter((t) => (f.to ? t.date <= f.to : true))
    .filter((t) => (f.category === undefined ? true : f.category === "none" ? !t.category : t.category === f.category))
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}

/** Súčty v centoch podľa typu za zvolené obdobie (FR-15). */
export function totalsByType(transactions: Transaction[]): Partial<Record<TransactionType, number>> {
  const out: Partial<Record<TransactionType, number>> = {};
  for (const t of transactions) out[t.type] = (out[t.type] ?? 0) + t.amountCents;
  return out;
}

/** Súčty výdavkov v centoch podľa kategórie; bez kategórie sa počítajú ako „nezaradené“ (D-106). */
export function expenseTotalsByCategory(transactions: Transaction[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type !== "vydavok") continue;
    const key = t.category ?? "nezaradené";
    out[key] = (out[key] ?? 0) + t.amountCents;
  }
  return out;
}
