import type { Transaction } from "./model/entities";

/**
 * Mesačné sporenie odvodené z transakcií (D-031, D-040):
 * súčet sporenia (do hotovosti) a investícií za 12 kalendárnych mesiacov, ktoré končia pri D_L,
 * delený počtom mesiacov histórie od prvej transakcie, najviac 12.
 * Sumy v centoch.
 */
export interface MonthlySaving {
  inv: number; // m_inv (investícia)
  cash: number; // m_cash (sporenie)
}

const monthIndex = (iso: string) => {
  const [y, m] = iso.split("-").map(Number);
  return y * 12 + (m - 1);
};

export function monthlySaving(transactions: Transaction[], lastReviewIso: string): MonthlySaving {
  const endIdx = monthIndex(lastReviewIso);
  const windowStart = endIdx - 11;
  const savings = transactions.filter(
    (t) => (t.type === "sporenie" || t.type === "investicia") && t.date <= lastReviewIso && monthIndex(t.date) >= windowStart,
  );
  if (savings.length === 0) return { inv: 0, cash: 0 };
  const firstIdx = Math.min(...transactions.filter((t) => t.date <= lastReviewIso).map((t) => monthIndex(t.date)));
  const historyMonths = Math.min(12, endIdx - firstIdx + 1);
  const sum = (type: "sporenie" | "investicia") =>
    savings.filter((t) => t.type === type).reduce((acc, t) => acc + t.amountCents, 0);
  return {
    inv: Math.round(sum("investicia") / historyMonths),
    cash: Math.round(sum("sporenie") / historyMonths),
  };
}
