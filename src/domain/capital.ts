import type { Snapshot, Transaction } from "./model/entities";
import { monthlyRate, monthsToTarget } from "./goal";

/** Kapitál rozdelený na dva zásobníky (D-036, D-039, D-041). Sumy v centoch. */
export interface Capital {
  inv: number; // K_inv: investície, zhodnocujú sa r
  cash: number; // K_cash: hotovosť, 0 % reálne
}

const MAX_MONTHS = 14_400; // 1 200 rokov, poistka proti nekonečnej slučke

/**
 * Transakcia sa počíta do kapitálu po vyhodnotení (D-121, D-123), ak má dátum po vyhodnotení,
 * alebo ak bola zadaná po uložení vyhodnotenia (zabudnutý výdavok s dátumom pred ním).
 * Transakcia zadaná pred vyhodnotením s dátumom pred ním je už v jeho hodnote, nepridáva sa znovu.
 */
export function isAfterEvaluation(t: Pick<Transaction, "date" | "createdAt">, snapshot: Pick<Snapshot, "date" | "createdAt">): boolean {
  return t.date > snapshot.date || t.createdAt > snapshot.createdAt;
}

/** Celkový kapitál K_L = K_inv + K_cash. */
function totalCapital(c: Capital): number {
  return c.inv + c.cash;
}

/**
 * Počet mesiacov do cieľa pri dvoch zásobníkoch (D-046).
 * Ak m_cash = 0, platí uzavretý tvar pre K_inv s T − K_cash (D-039).
 * Ak m_cash > 0, hľadáme najmenšie celé k, pre ktoré K_inv(k) + K_cash + m_cash·k ≥ T,
 * a zlomok získame lineárnou interpoláciou medzi k−1 a k.
 * Ak cieľ nie je dosiahnutý do MAX_MONTHS (1 200 rokov), vráti Infinity; zobrazí sa ako viac ako 50 rokov (D-019, nález T5).
 */
export function monthsToTargetSplit(
  c: Capital,
  mInv: number,
  mCash: number,
  annualRate: number,
  targetCents: number,
): number | null {
  if (totalCapital(c) >= targetCents) return 0;
  if (mCash === 0) return monthsToTarget(c.inv, mInv, annualRate, targetCents - c.cash);

  const i = monthlyRate(annualRate);
  const valueAt = (k: number): number => {
    const g = Math.pow(1 + i, k);
    const invGrown = c.inv * g + (i > 0 ? (mInv * (g - 1)) / i : mInv * k);
    return invGrown + c.cash + mCash * k;
  };

  for (let k = 1; k <= MAX_MONTHS; k++) {
    const b = valueAt(k);
    if (b >= targetCents) {
      const a = valueAt(k - 1);
      return k - 1 + (targetCents - a) / (b - a);
    }
  }
  return Infinity;
}

/** Výsledok výdavku alebo presunu: nový stav a prípadné upozornenie (D-021, D-045). */
type MoveResult =
  | { ok: true; capital: Capital; warning?: "exhausted" }
  | { ok: false; reason: "insufficient_cash"; suggestion: "investments" }
  | { ok: false; reason: "invalid_amount" };

/**
 * Výdavok z hotovosti (D-058): limit je K_cash (voľná hotovosť). Rezerva je mimo K_cash a do kontroly nevstupuje.
 * Ak by K_cash klesol pod 0, výdavok sa nevykoná a navrhne sa zdroj „z investícií“.
 * Záporná alebo neplatná suma sa nevykoná (T6, docs/05 §4: suma je nezáporná).
 */
export function payFromCash(c: Capital, amount: number): MoveResult {
  if (!(amount >= 0)) return { ok: false, reason: "invalid_amount" };
  if (c.cash - amount < 0) return { ok: false, reason: "insufficient_cash", suggestion: "investments" };
  return { ok: true, capital: { inv: c.inv, cash: c.cash - amount } };
}

/** Hlásenie pri vyčerpaní investícií (GC-15, D-224). Zobrazuje ho Transakcie pred potvrdením výdavku. */
export const INVESTMENTS_EXHAUSTED_TEXT = "Investície nestačia. Po uložení bude hodnota investícií 0 €. Ak výdavok platíš z príjmu, zvoľ zdroj „z príjmu“.";

/**
 * Výdavok z investícií (D-045): K_inv klesne, K_cash sa nemení.
 * Ak výdavok presiahne K_inv, K_inv sa zastaví na 0 a vráti sa upozornenie „kapitál by bol vyčerpaný“ (H2).
 */
export function payFromInvestments(c: Capital, amount: number): MoveResult {
  if (!(amount >= 0)) return { ok: false, reason: "invalid_amount" };
  const after = c.inv - amount;
  if (after < 0) return { ok: true, capital: { inv: 0, cash: c.cash }, warning: "exhausted" };
  return { ok: true, capital: { inv: after, cash: c.cash } };
}

/**
 * Presun hotovosti do investícií (doinvestovanie, D-045, upresnené D-058): K sa nemení.
 * Smie najviac vyčerpať K_cash; rezerva sa nedotkne.
 */
export function transferToInvestments(c: Capital, amount: number): MoveResult {
  if (!(amount >= 0)) return { ok: false, reason: "invalid_amount" };
  if (c.cash - amount < 0) return { ok: false, reason: "insufficient_cash", suggestion: "investments" };
  return { ok: true, capital: { inv: c.inv + amount, cash: c.cash - amount } };
}

/**
 * Dopad pri dvoch zásobníkoch (FR-04, N1): n(pred) − n(po) v mesiacoch, surový rozdiel.
 * Null, ak niektorý scenár cieľ nedosiahne.
 */
export function impactMonthsSplit(
  before: Capital,
  after: Capital,
  mInv: number,
  mCash: number,
  annualRate: number,
  targetCents: number,
): number | null {
  const nBefore = monthsToTargetSplit(before, mInv, mCash, annualRate, targetCents);
  const nAfter = monthsToTargetSplit(after, mInv, mCash, annualRate, targetCents);
  if (nBefore === null || nAfter === null) return null;
  return nBefore - nAfter;
}
