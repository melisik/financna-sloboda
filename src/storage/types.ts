/** Typy transakcie (05 §4, D-006, D-037). */
export const TRANSACTION_TYPES = ["sporenie", "investicia", "vydavok", "rezerva", "vyber_rezervy"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

/** Zdroj úhrady výdavku a presunu (D-045). */
export const SOURCES = ["z_prijmu", "z_hotovosti", "z_investicii"] as const;
export type Source = (typeof SOURCES)[number];

/** Kategórie výdavkov pre rozpočet (D-106). Zoznam je návrh a overí sa pred spustením pre používateľov. */
export const BUDGET_CATEGORIES = ["bývanie", "jedlo", "doprava", "zdravie", "deti a vzdelávanie", "oblečenie", "zábava", "predplatné a služby", "iné"] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export interface Budget {
  id: string; // rovnaké ako kategória
  category: BudgetCategory;
  limitCents: number; // mesačný limit, kladné celé číslo v centoch
  updatedAt: string; // ISO
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD, bez časovej zóny (05 §4)
  type: TransactionType;
  amountCents: number; // kladné celé centy
  source?: Source; // povinné pri výdavku
  belowThreshold?: boolean; // D-030
  category?: BudgetCategory; // len pri výdavku; bez hodnoty = nezaradené (D-106)
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
  auto?: boolean; // true = vytvorené automaticky z transakcií (D-116)
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
  mortgageRate?: number; // úroková sadzba p. a., napr. 0.036; bez hodnoty = 0 (FR-22)
  monthlyOtherCostsCents?: number; // ostatné mesačné náklady: údržba, poistenie, poplatky
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Ďalšie ocenitelné aktíva (návrh docs/11, bod 10). Do K sa zatiaľ nepočítajú (predpoklad). */
export const ASSET_KINDS = ["automobil", "pravo"] as const;
export type AssetKind = (typeof ASSET_KINDS)[number];

export interface Asset {
  id: string;
  kind: AssetKind;
  name: string; // max 80 znakov; pri automobile napr. značka a rok, pri práve napr. podiel
  valueCents: number; // odhad hodnoty, nie trhová cena
  valueDate: string; // YYYY-MM-DD
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Druh investície v sekcii Investície (D-101, docs/12). */
export const INVESTMENT_KINDS = ["akcie", "etf", "fond", "dlhopisy", "krypto", "zlato_komodity", "sporiaci_ucet", "treti_pilier", "dochodkove_sporenie", "ine"] as const;
/** Druhy, pri ktorých sa zadáva stav účtu namiesto počtu kusov a ceny (D-105). */
export const BALANCE_INVESTMENT_KINDS = ["sporiaci_ucet", "treti_pilier", "dochodkove_sporenie"] as const;
export type InvestmentKind = (typeof INVESTMENT_KINDS)[number];

/** Položka investície zadaná ručne (D-101, možnosť A). Hodnota v eurách = počet × cena × kurz. */
/** Daňový režim investície (FR-24). Katalóg je v domain/tax.ts; sadzby sú neoverené (D-104). */
export const TAX_REGIMES = ["nezadane", "zdanene", "oslobodene"] as const;
export type TaxRegime = (typeof TAX_REGIMES)[number];

export interface Position {
  id: string;
  name: string; // max 80 znakov, napr. ticker alebo názov fondu
  kind: InvestmentKind;
  quantity: number; // počet kusov, kladné, môže byť desatinný
  unitPrice: number; // cena za kus v mene položky
  currency: string; // ISO kód, napr. EUR, USD
  fxToEur: number; // koľko EUR za 1 jednotku meny; pri EUR je 1
  valueDate: string; // dátum ocenenia, YYYY-MM-DD
  monthlyContributionCents?: number; // mesačný vklad, len pri treťom pilieri; len na zobrazenie (D-102, D-105)
  taxRegime?: TaxRegime; // daňový režim (FR-24); bez hodnoty = nezadané
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Záväzky okrem hypotéky (D-103). Hypotéka je v Majetku (FR-22). */
export const LIABILITY_KINDS = ["uver", "kreditka", "leasing", "ine"] as const;
export type LiabilityKind = (typeof LIABILITY_KINDS)[number];

export interface Liability {
  id: string;
  name: string; // max 80 znakov
  kind: LiabilityKind;
  balanceCents: number; // zostatok dlhu
  rate: number; // úroková sadzba p. a., napr. 0.089; 0 ak nie je
  monthlyPaymentCents: number; // mesačná splátka podľa zmluvy
  endDate?: string; // predpokladaný koniec, YYYY-MM-DD; môže byť v budúcnosti
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** Druh príjmu (D-109). Nájom z nehnuteľnosti patrí do Majetku. */
export const INCOME_KINDS = ["mzda", "socialna_davka", "invalidny_dochodok", "starobny_dochodok", "osetrovne", "nemocenska_davka", "ine"] as const;
export type IncomeKind = (typeof INCOME_KINDS)[number];
/** Pravidelný príjem sa počíta do mesačného súčtu; nepravidelný sa zobrazí zvlášť (D-109). */
export const INCOME_FREQUENCIES = ["mesacne", "nepravidelne"] as const;
export type IncomeFrequency = (typeof INCOME_FREQUENCIES)[number];

/** Príjem (D-102, D-109). Sporenie m sa mení až pri vyhodnotení, nie podľa tejto položky. */
export interface RegularIncome {
  id: string;
  name: string; // max 80 znakov, napr. mzda
  kind: IncomeKind;
  frequency: IncomeFrequency;
  amountCents: number; // suma, kladná; pri nepravidelnom za jeden výskyt
  dayOfMonth?: number; // deň v mesiaci 1–31; len na orientáciu
  startDate: string; // YYYY-MM-DD, od kedy príjem platí
  endDate?: string; // YYYY-MM-DD, posledný deň platnosti; bez hodnoty trvá
  source?: string; // názov zdroja, ak položku dodala integračná služba (D-112)
  fetchedAt?: string; // kedy zdroj údaj získal, ISO
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export const RECURRING_FREQUENCIES = ["mesacne", "rocne"] as const;
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];

/** Pravidelný výdavok (D-124): predplatné, poistka, paušál. Iba zobrazenie; nemení K ani sporenie. */
export interface RecurringExpense {
  id: string;
  name: string; // max 80 znakov
  category: BudgetCategory;
  frequency: RecurringFrequency;
  amountCents: number; // kladná suma za jeden výskyt (mesiac alebo rok)
  startDate: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD, bez hodnoty trvá
  createdAt: string;
  updatedAt: string;
}

/** Jednotky skladu (sklad potravín). */
export const STOCK_UNITS = ["ks", "g", "kg", "ml", "l"] as const;
export type StockUnit = (typeof STOCK_UNITS)[number];

/** Položka skladu potravín: množstvo a dátum spotreby (samostatná sekcia). */
export interface StockItem {
  id: string;
  name: string; // max 80 znakov
  quantity: number; // kladné, môže byť desatinné
  unit: StockUnit;
  expiryDate?: string; // dátum spotreby, YYYY-MM-DD; bez hodnoty = bez dátumu
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  settings: Settings | null;
  transactions: Transaction[];
  snapshots: Snapshot[];
  properties: Property[];
  assets: Asset[];
  investments: Position[];
  liabilities: Liability[];
  incomes: RegularIncome[];
  budgets: Budget[];
  recurringExpenses: RecurringExpense[];
  stockItems: StockItem[];
}

/** Obal zálohy (05 §4, FR-17). */
export const APP_NAME = "financna-sloboda";
export const SCHEMA_VERSION = 4; // v2 pridáva properties (FR-28); v3 pravidelné výdavky (D-124); v4 sklad
/** Verzie schémy, ktoré import prijme; verzia 1 nemá majetok (načíta sa prázdny zoznam). */
export const READABLE_SCHEMA_VERSIONS = [1, 2, 3, 4] as const;
