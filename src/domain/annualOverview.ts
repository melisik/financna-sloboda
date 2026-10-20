import type { Snapshot } from "../storage/types";
import { goalMonths } from "./rentalGoal";
import { goalDisplay, type GoalDisplay } from "./goalDisplay";

/** Aktuálne nastavenia, z ktorých sa počíta dátum cieľa pre každé vyhodnotenie (docs/13, oddiel 4). */
export interface OverviewSettings {
  target: number; // cieľová suma T v centoch
  realReturn: number; // r
  mInv: number; // mesačné sporenie do investícií
  mCash: number; // mesačné sporenie do hotovosti
}

/** Jeden riadok Ročného prehľadu. Nehnuteľnosti sa neukladajú do vyhodnotení, preto sú mimo K. */
export interface OverviewRow {
  date: string;
  auto: boolean;
  invCents: number;
  cashCents: number;
  totalCents: number; // K = K_inv + K_cash
  deltaTotalCents: number | null; // zmena K oproti predchádzajúcemu riadku
  goal: GoalDisplay | null; // null, ak nie sú Nastavenia
  deltaGoalMonths: number | null; // zmena dátumu cieľa v mesiacoch, + = neskôr
}

/** Mesiac v čase ako celé číslo (rok · 12 + mesiac) na porovnanie dátumov cieľa. */
function monthIndex(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

/**
 * Ročný prehľad (docs/13, oddiel 4): riadky od najstaršieho vyhodnotenia.
 * Dátum cieľa sa počíta z uloženého K a z aktuálnych Nastavení, bez nehnuteľností.
 */
export function annualOverview(snapshots: Snapshot[], s: OverviewSettings | null): OverviewRow[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const rows: OverviewRow[] = [];
  let prevTotal: number | null = null;
  let prevGoalIdx: number | null = null;

  for (const snap of sorted) {
    const totalCents = snap.investmentsCents + snap.cashCents;
    let goal: GoalDisplay | null = null;
    let goalIdx: number | null = null;
    if (s) {
      const g = goalMonths({ inv: snap.investmentsCents, cash: snap.cashCents }, s.mInv, s.mCash, s.realReturn, s.target, []);
      const months = g.kind === "months" ? g.months : null;
      goal = goalDisplay(months, snap.date, snap.date);
      if (goal.kind === "date" || goal.kind === "reached") goalIdx = monthIndex(goal.date);
    }
    rows.push({
      date: snap.date,
      auto: snap.auto ?? false,
      invCents: snap.investmentsCents,
      cashCents: snap.cashCents,
      totalCents,
      deltaTotalCents: prevTotal === null ? null : totalCents - prevTotal,
      goal,
      deltaGoalMonths: prevGoalIdx !== null && goalIdx !== null ? goalIdx - prevGoalIdx : null,
    });
    prevTotal = totalCents;
    prevGoalIdx = goalIdx;
  }
  return rows;
}
