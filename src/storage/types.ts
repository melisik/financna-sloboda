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
  savingInvCents?: number; // m_inv, prepísané používateľom; bez hodnoty sa použije odvodená (D-031)
  savingCashCents?: number; // m_cash, rovnako
  feesRate?: number; // poplatky p. a., napr. 0.005; bez hodnoty = 0 (D-064)
  lastReviewDate?: string; // D_L
}

/** Režim nehnuteľnosti (FR-20, D-093). „nezadane“ je predvolené a do K sa nepočíta. */
export const PROPERTY_MODES = ["vlastne_byvanie", "prenajom", "nezadane"] as const;
export type PropertyMode = (typeof PROPERTY_MODES)[number];

/** Nehnuteľnosť v karte majetku (FR-20 až FR-22, návrh docs/11_Karta_majetku.md). */
export interface Property {
  id: string;
  name?: string; // max 80 znakov, len na orientáciu
  mode: PropertyMode;
  valueCents: number; // odhad hodnoty, nie trhová cena (FR-21, D-080)
  valueDate: string; // dátum odhadu, YYYY-MM-DD (D-089)
  mortgageBalanceCents: number; // zostatok hypotéky; 0 ak nie je
  monthlyRentCents?: number; // mesačný nájom (FR-23), len pri režime prenájom
  monthlyPaymentCents?: number; // mesačná splátka hypotéky podľa zmluvy (FR-22, D-084)
  monthlyOtherCostsCents?: number; // ostatné mesačné náklady: údržba, poistenie, poplatky
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export interface AppData {
  settings: Settings | null;
  transactions: Transaction[];
  snapshots: Snapshot[];
  properties: Property[];
}

/** Obal zálohy (05 §4, FR-17). */
export const APP_NAME = "financna-sloboda";
export const SCHEMA_VERSION = 2; // v2 pridáva properties (FR-28)
/** Verzie schémy, ktoré import prijme; verzia 1 nemá majetok (načíta sa prázdny zoznam). */
export const READABLE_SCHEMA_VERSIONS = [1, 2] as const;
