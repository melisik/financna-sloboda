/** Typy transakcie (05 §4, D-006, D-037). */
export const TRANSACTION_TYPES = ["sporenie", "investicia", "vydavok", "rezerva", "vyber_rezervy"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Zdroj úhrady výdavku a presunu (D-045). */
export const SOURCES = ["z_prijmu", "z_hotovosti", "z_investicii"] as const;
export type Source = (typeof SOURCES)[number];

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD, bez časovej zóny (05 §4)
  type: TransactionType;
  amountCents: number; // kladné celé centy
  source?: Source; // povinné pri výdavku
  belowThreshold?: boolean; // D-030
  note?: string; // max 200 znakov
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface Snapshot {
  id: string;
  date: string; // dátum vyhodnotenia (M2: nesmie byť v budúcnosti)
  investmentsCents: number;
  cashCents: number; // nasporená suma = kumulatívny stav hotovosti (D-033)
  createdAt: string;
}

export interface Settings {
  expensesCents: number; // V
  withdrawalRate: number; // p, napr. 0.037 (D-049)
  realReturn: number; // r, napr. 0.035 (D-050)
  reserveCents: number; // rezerva (D-047)
  thresholdCents: number; // prah výdavkov (D-048)
  savingInvCents: number; // m_inv
  savingCashCents: number; // m_cash
  lastReviewDate?: string; // D_L
}

export interface AppData {
  settings: Settings | null;
  transactions: Transaction[];
  snapshots: Snapshot[];
}

/** Obal zálohy (05 §4, FR-17). */
export const APP_NAME = "financna-sloboda";
export const SCHEMA_VERSION = 1;
