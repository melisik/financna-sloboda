import type { Transaction, TransactionType } from "../storage/types";

export interface HistoryFilter {
  type?: TransactionType; // undefined = všetky typy
  from?: string; // YYYY-MM-DD, vrátane
  to?: string; // YYYY-MM-DD, vrátane
}

/** Filter a zoradenie od najnovšej (FR-15). */
export function filterHistory(transactions: Transaction[], f: HistoryFilter): Transaction[] {
  return transactions
    .filter((t) => (f.type ? t.type === f.type : true))
    .filter((t) => (f.from ? t.date >= f.from : true))
    .filter((t) => (f.to ? t.date <= f.to : true))
    .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)));
}

/** Súčty v centoch podľa typu za zvolené obdobie (FR-15). */
export function totalsByType(transactions: Transaction[]): Partial<Record<TransactionType, number>> {
  const out: Partial<Record<TransactionType, number>> = {};
  for (const t of transactions) out[t.type] = (out[t.type] ?? 0) + t.amountCents;
  return out;
}
