import { isAfterEvaluation, type Capital } from "./capital";
import type { Snapshot, Transaction } from "./model/entities";

/**
 * Kapitál = posledné vyhodnotenie + transakcie po jeho zadaní (FR-04, FR-05, D-024, D-121).
 * Transakcie s dátumom ≤ D_L sú už v snapshote a nepridávajú sa znovu.
 *
 * Účinky na K_inv a K_cash (D-036, D-041, D-045, D-037):
 * - sporenie → K_cash
 * - investícia z príjmu → K_inv; investícia z hotovosti (presun) → K_cash −, K_inv +
 * - výdavok z hotovosti → K_cash −; výdavok z investícií → K_inv −; z príjmu → bez zmeny
 * - rezerva (vklad) → K_cash − (peniaze odchádzajú z K); výber z rezervy → K_cash +
 * Výsledky sa zarážajú na 0 (H2); pôvodný záporný stav sa hlási cez capitalWithFlags.
 */
export function currentCapital(snapshot: Snapshot | null, transactions: Transaction[]): Capital {
  return capitalWithFlags(snapshot, transactions).capital;
}

/**
 * Ako currentCapital, ale hlási, či sa niektorá zložka dostala pod 0 (R2).
 * Záporný stav znamená nekonzistentné zadanie (napr. výdavok nad stav); UI ho musí ukázať, nie skryť.
 */
export { isAfterEvaluation } from "./capital";

type Shortfall = { inv: number; cash: number };

export function capitalWithFlags(snapshot: Snapshot | null, transactions: Transaction[]): { capital: Capital; negative: { inv: boolean; cash: boolean }; shortfall: Shortfall } {
  if (!snapshot) return { capital: { inv: 0, cash: 0 }, negative: { inv: false, cash: false }, shortfall: { inv: 0, cash: 0 } };
  let inv = snapshot.investmentsCents;
  let cash = snapshot.cashCents;
  const after = transactions
    .filter((t) => isAfterEvaluation(t, snapshot))
    .sort((a, b) => (a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date)));
  for (const t of after) {
    const a = t.amountCents;
    switch (t.type) {
      case "sporenie":
        cash += a;
        break;
      case "investicia":
        if (t.source === "z_hotovosti") {
          cash -= a;
        }
        inv += a;
        break;
      case "vydavok":
        if (t.source === "z_hotovosti") cash -= a;
        if (t.source === "z_investicii") inv -= a;
        break;
      case "rezerva":
        cash -= a;
        break;
      case "vyber_rezervy":
        cash += a;
        break;
    }
  }
  return {
    capital: { inv: Math.max(0, inv), cash: Math.max(0, cash) },
    negative: { inv: inv < 0, cash: cash < 0 },
    // Suma, ktorá presiahla stav a nie je odpočítaná z K (nález 3, D-045). Zobrazí sa v Prehľade.
    shortfall: { inv: Math.max(0, -inv), cash: Math.max(0, -cash) },
  };
}

/** Stav rezervy = vklady mínus výbery (D-047). Nie je súčasťou K. */
export function reserveBalance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => {
    if (t.type === "rezerva") return sum + t.amountCents;
    if (t.type === "vyber_rezervy") return sum - t.amountCents;
    return sum;
  }, 0);
}
