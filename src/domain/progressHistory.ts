import type { GoalDisplay } from "./goalDisplay";

/** Posun dátumu cieľa od prvého po posledné vyhodnotenie; kladné mesiace = bližšie (D-289, docs/44). */
export interface HistoryShift {
  months: number;
  since: string;
  from: string;
  to: string;
}

const monthIndex = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
};

/**
 * Riadky sú z `annualOverview` (uložený K, dnešné nastavenia, nehnuteľnosti v prenájme podľa D-169).
 * Posun sa nepočíta pri menej ako dvoch vyhodnoteniach ani vtedy, keď prvý alebo posledný cieľ nie je dátum.
 */
export function historyShift(rows: { date: string; goal: GoalDisplay | null }[]): HistoryShift | null {
  if (rows.length < 2) return null;
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (first.goal?.kind !== "date" || last.goal?.kind !== "date") return null;
  return { months: monthIndex(first.goal.date) - monthIndex(last.goal.date), since: first.date, from: first.goal.date, to: last.goal.date };
}
