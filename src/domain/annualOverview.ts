import type { Snapshot, Transaction } from "./model/entities";
import { goalMonths, type Rental } from "./rentalGoal";
import { isAfterEvaluation } from "./capital";
import { goalDisplay, type GoalDisplay } from "./goalDisplay";

/** Aktuálne nastavenia, z ktorých sa počíta dátum cieľa pre každé vyhodnotenie (docs/13, oddiel 4). */
export interface OverviewSettings {
  target: number; // cieľová suma T v centoch
  realReturn: number; // r
  mInv: number; // mesačné sporenie do investícií
  mCash: number; // mesačné sporenie do hotovosti
}

/** Jeden riadok Ročného prehľadu. Nehnuteľnosti sa neukladajú do vyhodnotení, preto sú mimo K. */
interface OverviewRow {
  date: string;
  auto: boolean;
  invCents: number;
  cashCents: number;
  totalCents: number; // K = K_inv + K_cash
  deltaTotalCents: number | null; // zmena K oproti predchádzajúcemu riadku
  goal: GoalDisplay | null; // null, ak nie sú Nastavenia
  deltaGoalMonths: number | null; // zmena dátumu cieľa v mesiacoch, + = neskôr
  // Rozpis zmeny K od predchádzajúceho vyhodnotenia (null pri prvom riadku). Výnos a ostatné je zvyšok.
  sporenieCents: number | null;
  vydavkyCents: number | null; // výdavky z hotovosti alebo z investícií (z príjmu nemenia K)
  ostatneCents: number | null; // zvyšok: výnos a trhové zmeny
}

/** Ročný súhrn (docs/13, oddiel 4): K na konci roka, zmena za rok, sporenie, výdavky a najväčšia kategória. */
interface YearSummary {
  year: number;
  endK: number | null; // K z posledného vyhodnotenia v roku
  deltaK: number | null; // zmena oproti poslednému vyhodnoteniu pred rokom
  sporenieCents: number;
  vydavkyCents: number;
  topCategory: { name: string; cents: number } | null;
}

/**
 * Sporenie a výdavky, ktoré menia K po vyhodnotení `prev` až do dňa `toInclusive`.
 * Hranica je rovnaká ako pri K (isAfterEvaluation): rozhoduje dátum a čas zápisu, nie len deň (nález 7).
 */
export function flowsBetween(transactions: Transaction[], prev: Snapshot, toInclusive: string) {
  let sporenie = 0;
  let vydavky = 0;
  for (const t of transactions) {
    if (!isAfterEvaluation(t, prev) || t.date > toInclusive) continue;
    if (t.type === "sporenie") sporenie += t.amountCents;
    if (t.type === "vydavok" && (t.source === "z_hotovosti" || t.source === "z_investicii")) vydavky += t.amountCents;
  }
  return { sporenie, vydavky };
}

/** Mesiac v čase ako celé číslo (rok · 12 + mesiac) na porovnanie dátumov cieľa. */
function monthIndex(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
}

/**
 * Ročný prehľad (docs/13, oddiel 4): riadky od najstaršieho vyhodnotenia.
 * Dátum cieľa sa počíta z uloženého K, aktuálnych Nastavení a nehnuteľností v prenájme (rovnako ako hlavný cieľ, nález 6).
 */
export function annualOverview(snapshots: Snapshot[], s: OverviewSettings | null, transactions: Transaction[] = [], rentals: Rental[] = []): OverviewRow[] {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  const rows: OverviewRow[] = [];
  let prevTotal: number | null = null;
  let prevSnap: Snapshot | null = null;
  let prevGoalIdx: number | null = null;

  for (const snap of sorted) {
    const totalCents = snap.investmentsCents + snap.cashCents;
    let goal: GoalDisplay | null = null;
    let goalIdx: number | null = null;
    if (s) {
      const g = goalMonths({ inv: snap.investmentsCents, cash: snap.cashCents }, s.mInv, s.mCash, s.realReturn, s.target, rentals);
      const months = g.kind === "months" ? g.months : null;
      goal = goalDisplay(months, snap.date, snap.date);
      if (goal.kind === "date" || goal.kind === "reached") goalIdx = monthIndex(goal.date);
    }
    const deltaTotalCents = prevTotal === null ? null : totalCents - prevTotal;
    const flows = prevSnap === null ? null : flowsBetween(transactions, prevSnap, snap.date);
    rows.push({
      date: snap.date,
      auto: snap.auto ?? false,
      invCents: snap.investmentsCents,
      cashCents: snap.cashCents,
      totalCents,
      deltaTotalCents,
      goal,
      deltaGoalMonths: prevGoalIdx !== null && goalIdx !== null ? goalIdx - prevGoalIdx : null,
      sporenieCents: flows && deltaTotalCents !== null ? flows.sporenie : null,
      vydavkyCents: flows && deltaTotalCents !== null ? flows.vydavky : null,
      ostatneCents: flows && deltaTotalCents !== null ? deltaTotalCents - flows.sporenie + flows.vydavky : null,
    });
    prevTotal = totalCents;
    prevSnap = snap;
    prevGoalIdx = goalIdx;
  }
  return rows;
}

/** Ročné súhrny od najstaršieho roka; roky z vyhodnotení aj z transakcií. */
export function yearlySummary(snapshots: Snapshot[], transactions: Transaction[]): YearSummary[] {
  const yearOf = (iso: string) => Number(iso.slice(0, 4));
  const years = [...new Set([...snapshots.map((x) => yearOf(x.date)), ...transactions.map((x) => yearOf(x.date))])].sort((a, b) => a - b);
  const sortedSnaps = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  return years.map((year) => {
    const inYear = sortedSnaps.filter((x) => yearOf(x.date) === year);
    const last = inYear[inYear.length - 1];
    const before = sortedSnaps.filter((x) => yearOf(x.date) < year);
    const prev = before[before.length - 1];
    const endK = last ? last.investmentsCents + last.cashCents : null;
    const prevK = prev ? prev.investmentsCents + prev.cashCents : null;

    const txs = transactions.filter((t) => yearOf(t.date) === year);
    const sporenie = txs.filter((t) => t.type === "sporenie").reduce((sum, t) => sum + t.amountCents, 0);
    const expenses = txs.filter((t) => t.type === "vydavok");
    const vydavky = expenses.reduce((sum, t) => sum + t.amountCents, 0);
    const byCat: Record<string, number> = {};
    for (const t of expenses) {
      const key = t.category ?? "nezaradené";
      byCat[key] = (byCat[key] ?? 0) + t.amountCents;
    }
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

    return {
      year,
      endK,
      deltaK: endK !== null && prevK !== null ? endK - prevK : null,
      sporenieCents: sporenie,
      vydavkyCents: vydavky,
      topCategory: top ? { name: top[0], cents: top[1] } : null,
    };
  });
}
