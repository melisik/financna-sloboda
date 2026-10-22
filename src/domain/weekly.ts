import type { Transaction } from "./model/entities";

/** Týždenný súhrn výdavkov (N-10): posledných 7 dní vrátane dneška. Len výdavky; nič sa neodosiela. */
interface WeeklySummary {
  fromIso: string;
  toIso: string;
  count: number;
  totalCents: number;
  overThresholdCount: number;
  byCategory: { category: string; cents: number }[];
}

function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function weeklySummary(transactions: Transaction[], todayIso: string, thresholdCents: number): WeeklySummary {
  const fromIso = addDays(todayIso, -6);
  const expenses = transactions.filter((t) => t.type === "vydavok" && t.date >= fromIso && t.date <= todayIso);
  const perCategory = new Map<string, number>();
  for (const t of expenses) {
    const key = t.category ?? "nezaradené";
    perCategory.set(key, (perCategory.get(key) ?? 0) + t.amountCents);
  }
  return {
    fromIso,
    toIso: todayIso,
    count: expenses.length,
    totalCents: expenses.reduce((sum, t) => sum + t.amountCents, 0),
    overThresholdCount: expenses.filter((t) => t.amountCents >= thresholdCents).length,
    byCategory: [...perCategory.entries()].map(([category, cents]) => ({ category, cents })).sort((a, b) => b.cents - a.cents),
  };
}
