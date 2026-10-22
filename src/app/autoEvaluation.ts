import { monthlyRate } from "../domain/goal";
import type { Snapshot, Transaction } from "../storage/types";
import { capitalWithFlags } from "../domain/ledger";

/** Posledný deň predchádzajúceho mesiaca k dnešku (YYYY-MM-DD). Napr. 2026-11-02 → 2026-10-31. */
export function lastCompletedMonthEnd(today: string): string {
  const [y, m] = today.split("-").map(Number);
  const prevYear = m === 1 ? y - 1 : y;
  const prevMonth = m === 1 ? 12 : m - 1;
  const daysInPrev = new Date(Date.UTC(prevYear, prevMonth, 0)).getUTCDate();
  return `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(daysInPrev).padStart(2, "0")}`;
}

/** Počet ukončených mesiacov medzi dvoma dátumami (podľa kalendárnych mesiacov). */
function monthsBetween(fromIso: string, toIso: string): number {
  const [y1, m1] = fromIso.split("-").map(Number);
  const [y2, m2] = toIso.split("-").map(Number);
  return (y2 * 12 + m2) - (y1 * 12 + m1);
}

/**
 * Automatické vyhodnotenie (D-116). Vráti nové vyhodnotenie za posledný ukončený mesiac, alebo null.
 * - Vyžaduje existujúce ručné vyhodnotenie (prvé je ručné, D-031).
 * - Hotovosť sa počíta z transakcií po poslednom vyhodnotení (rovnako ako kapitál).
 * - Investície: ak existujú položky, berie sa ich súčet (D-101). Inak sa posledná hodnota
 *   zvýši o mesačný výnos r za každý uplynutý mesiac (odhad; označený v zázname ako auto).
 */
export function autoSnapshot(input: {
  latest: Snapshot | null;
  transactions: Transaction[];
  positionsTotalCents: number | null;
  realReturn: number; // čistý reálny výnos p. a. (D-070)
  today: string;
  id: string;
  now: string;
}): Snapshot | null {
  const { latest, transactions, positionsTotalCents, realReturn, today, id, now } = input;
  if (!latest) return null;
  const end = lastCompletedMonthEnd(today);
  if (latest.date >= end) return null;

  // Transakcie až do konca vyhodnocovaného mesiaca; budúce sa nezapočítajú.
  const until = transactions.filter((t) => t.date <= end);
  const { capital } = capitalWithFlags(latest, until);
  const months = monthsBetween(latest.date, end);
  // Výnos sa počíta len z hodnoty na začiatku obdobia; vklady a výbery v období sa pripočítajú bez výnosu (audit, nález 9).
  const growth = positionsTotalCents === null ? Math.pow(1 + monthlyRate(realReturn), months) : 1;
  const netInvFlow = capital.inv - latest.investmentsCents;
  const investmentsCents = positionsTotalCents ?? Math.round(latest.investmentsCents * growth) + netInvFlow;

  return {
    id,
    date: end,
    investmentsCents,
    cashCents: capital.cash,
    createdAt: now,
    auto: true,
  };
}
