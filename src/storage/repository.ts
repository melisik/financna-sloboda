import type { Asset, AppData, Attachment, Budget, CalendarObligation, Dog, InvestmentGoal, Liability, Position, Property, Recipe, RecurringExpense, RegularIncome, StockItem, Snapshot, Transaction, Settings, WasteRecord, ShoppingItem } from "./types";

/** Rozhranie úložiska (05 §3): aplikácia a doména nevidia, či ide o IndexedDB. */
export interface Repository {
  getData(): Promise<AppData>;
  addTransaction(t: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  addSnapshot(s: Snapshot): Promise<void>;
  /** Ručné vyhodnotenie: auto-vyhodnotenia na rovnaký alebo neskorší dátum sa zmažú v tej istej transakcii (D-116). */
  addManualSnapshot(s: Snapshot): Promise<void>;
  deleteSnapshot(id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  saveProperty(p: Property): Promise<void>;
  deleteProperty(id: string): Promise<void>;
  saveAsset(a: Asset): Promise<void>;
  deleteAsset(id: string): Promise<void>;
  savePosition(p: Position): Promise<void>;
  deletePosition(id: string): Promise<void>;
  saveGoal(g: InvestmentGoal): Promise<void>;
  deleteGoal(id: string): Promise<void>;
  saveLiability(l: Liability): Promise<void>;
  deleteLiability(id: string): Promise<void>;
  saveIncome(i: RegularIncome): Promise<void>;
  /** Nahradí všetky príjmy od daného zdroja novými položkami v jednej transakcii (D-112). */
  replaceIncomesFromSource(source: string, items: RegularIncome[]): Promise<void>;
  deleteIncome(id: string): Promise<void>;
  saveBudget(b: Budget): Promise<void>;
  deleteBudget(id: string): Promise<void>;
  saveRecurringExpense(e: RecurringExpense): Promise<void>;
  deleteRecurringExpense(id: string): Promise<void>;
  saveCalendarObligation(o: CalendarObligation): Promise<void>;
  deleteCalendarObligation(id: string): Promise<void>;
  /**
   * Zaplatenie povinnosti (D-345): transakcia a zaplatená povinnosť sa zapíšu v jednej transakcii úložiska.
   * Idempotentné: ak povinnosť (alebo jej výskyt) už má transakciu, nič sa nezapíše a vráti sa created=false.
   */
  payCalendarObligation(paid: CalendarObligation, t: Transaction): Promise<{ created: boolean }>;
  /**
   * Zrušenie zaplatenia: zmaže presne prepojenú transakciu (aj prílohy) a vráti povinnosť do stavu „čaká“.
   * Pri chýbajúcej alebo nesprávne prepojenej transakcii vyhodí CalendarLinkError a nič nezmení.
   */
  unpayCalendarObligation(id: string): Promise<void>;
  /**
   * Atómovo nastaví „po splatnosti“ len povinnostiam, ktoré sú v čase zápisu stále „čaká“ a po termíne.
   * Zaplatené (aj práve zaplatené) povinnosti sa nikdy neprepíšu. Vráti počet zmenených záznamov.
   */
  markCalendarObligationsOverdue(ids: string[], today: string): Promise<number>;
  saveStockItem(i: StockItem): Promise<void>;
  deleteStockItem(id: string): Promise<void>;
  /** Zapíše zmenené množstvá skladu v jednej transakcii (uvarenie receptu, D-127). */
  applyStockChanges(items: StockItem[]): Promise<void>;
  /** Vyhodenie: zmenené množstvo položky a záznam o vyhodení v jednej transakcii (D-301). */
  discardStock(item: StockItem, record: WasteRecord): Promise<void>;
  /** Nákupný zoznam (D-302): uloženie viacerých položiek a ich zmazanie v jednej transakcii. */
  saveShoppingItems(items: ShoppingItem[]): Promise<void>;
  deleteShoppingItems(ids: string[]): Promise<void>;
  saveRecipe(r: Recipe): Promise<void>;
  deleteRecipe(id: string): Promise<void>;
  saveDog(d: Dog): Promise<void>;
  listAttachments(transactionId: string): Promise<Attachment[]>;
  listAllAttachments(): Promise<Attachment[]>;
  saveAttachment(a: Attachment): Promise<void>;
  deleteAttachment(id: string): Promise<void>;
  listRentalAttachments(entryId: string): Promise<Attachment[]>;
  deleteAttachmentsForRentalEntries(entryIds: string[]): Promise<void>;
  replaceAttachments(list: Attachment[]): Promise<void>;
  deleteDog(id: string): Promise<void>;
  /** Nahradí všetky dáta v jednej transakcii; pri chybe zostanú pôvodné dáta (FR-18, D-018). */
  replaceAll(data: AppData): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
  close(): void;
}
