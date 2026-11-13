import { openDB, type IDBPDatabase } from "idb";
import type { Repository } from "./repository";
import type { Asset, AppData, Attachment, Budget, Dog, InvestmentGoal, Liability, Position, Property, Recipe, RentalEntry, RecurringExpense, RegularIncome, Settings, Snapshot, StockItem, Transaction, WasteRecord, ShoppingItem, Person, Household, PersonalGoal } from "./types";
import { getEnvironmentConfig } from "../config/environment";

const DB_NAME = "financna-sloboda";
const DB_VERSION = 14; // 05 §4: verzia 1; verzia 2 pridáva úložisko majetku (FR-28); verzia 5 recepty (D-127); verzia 6 psy (D-159); verzia 7 prílohy (D-160); verzia 8 prílohy k výdavkom z prenájmu (D-221); verzia 9 ciele investícií (D-105); verzia 10 vyhodené potraviny (D-301); verzia 11 nákupný zoznam (D-302); verzia 12 finančný kalendár (D-345); verzia 13 osoby a domácnosti (C2.0 D-028); verzia 14 individuálne finančné ciele (C2.0 Fáza 2)
const SETTINGS_KEY = "current";

type Environment = "real" | "sandbox";

export const REAL_IMPORT_BLOCKED_MESSAGE =
  "Import zálohy je v REAL prostredí dočasne nedostupný, pretože záloha zatiaľ nezachováva všetky osobné údaje " +
  "(osobné ciele, prílohy, finančný kalendár). Export zálohy zostáva dostupný.";

/** Predpona izolovaných databáz pre Vitest (F-09). */
export const TEST_DB_PREFIX = "vitest-";

// vite build nahradí MODE konštantou "production", preto sa výnimka do zostavy nedostane.
function isTestIsolationDb(name: string): boolean {
  return import.meta.env.MODE === "test" && name.startsWith(TEST_DB_PREFIX) && !name.includes("compaven-2.0-real");
}

/** Otvorí databázu s úložiskami z 05 §4. */
// PHASE 1B OPRAVA: Jediný zdroj pravdy je VITE_COMPAVEN_ENV
export async function openRepository(name: string = DB_NAME): Promise<Repository> {
  const envConfig = getEnvironmentConfig();

  // A. Striktná kontrola názvu DB — musí sa zhodovať s konfiguráciou
  if (name !== envConfig.dbName && !isTestIsolationDb(name)) {
    throw new Error(
      `FATAL: Database name mismatch. ` +
      `Requested: "${name}", ` +
      `Expected for ${envConfig.env} environment: "${envConfig.dbName}". ` +
      `Use the correct build configuration (VITE_COMPAVEN_ENV=${envConfig.env}).`
    );
  }

  const db: IDBPDatabase = await openDB(name, DB_VERSION, {
    upgrade(d, oldVersion, _newVersion, transaction) {
      if (oldVersion < 1) {
        const tx = d.createObjectStore("transactions", { keyPath: "id" });
        tx.createIndex("date", "date");
        tx.createIndex("type", "type");
        d.createObjectStore("snapshots", { keyPath: "id" }).createIndex("date", "date");
        d.createObjectStore("settings");
        d.createObjectStore("meta");
      }
      if (oldVersion < 2) {
        d.createObjectStore("properties", { keyPath: "id" });
        d.createObjectStore("assets", { keyPath: "id" });
        d.createObjectStore("investments", { keyPath: "id" });
        d.createObjectStore("liabilities", { keyPath: "id" });
        d.createObjectStore("incomes", { keyPath: "id" });
        d.createObjectStore("budgets", { keyPath: "id" });
      }
      if (oldVersion < 3) {
        d.createObjectStore("recurringExpenses", { keyPath: "id" });
      }
      if (oldVersion < 4) {
        d.createObjectStore("stockItems", { keyPath: "id" });
      }
      if (oldVersion < 5) {
        d.createObjectStore("recipes", { keyPath: "id" });
      }
      if (oldVersion < 6) {
        d.createObjectStore("dogs", { keyPath: "id" });
      }
      if (oldVersion < 7) {
        const attachments = d.createObjectStore("attachments", { keyPath: "id" });
        attachments.createIndex("transactionId", "transactionId");
      }
      if (oldVersion < 8) {
        transaction.objectStore("attachments").createIndex("rentalEntryId", "rentalEntryId");
      }
      if (oldVersion < 9) {
        d.createObjectStore("goals", { keyPath: "id" });
      }
      if (oldVersion < 10) {
        d.createObjectStore("wasteRecords", { keyPath: "id" });
      }
      if (oldVersion < 11) {
        d.createObjectStore("shoppingItems", { keyPath: "id" });
      }
      if (oldVersion < 12) {
        d.createObjectStore("calendarObligations", { keyPath: "id" });
      }
      if (oldVersion < 13) {
        const persons = d.createObjectStore("persons", { keyPath: "id" });
        persons.createIndex("isCurrentUser", "isCurrentUser");
        const households = d.createObjectStore("households", { keyPath: "id" });
        households.createIndex("createdAt", "createdAt");
      }
      if (oldVersion < 14) {
        d.createObjectStore("personalGoals", { keyPath: "id" });
      }
    },
  });
  return new IdbRepository(db, envConfig.env);
}

export class IdbRepository implements Repository {
  constructor(private db: IDBPDatabase, private environment: Environment = "sandbox") {}

  async getData(): Promise<AppData> {
    const stores = ["transactions", "snapshots", "settings", "properties", "assets", "investments", "liabilities", "incomes", "budgets", "recurringExpenses", "stockItems", "recipes", "dogs", "goals", "wasteRecords", "shoppingItems", "calendarObligations", "persons", "households", "personalGoals"];
    const storesExist = stores.filter((s) => this.db.objectStoreNames.contains(s));
    const tx = this.db.transaction(storesExist, "readonly");
    const getData = async (store: string) => {
      try {
        return await tx.objectStore(store).getAll();
      } catch {
        return [];
      }
    };
    const [transactions, snapshots, settings, properties, assets, investments, liabilities, incomes, budgets, recurringExpenses, stockItems, recipes, dogs, goals, wasteRecords, shoppingItems, calendarObligations, persons, households, personalGoals] = await Promise.all([
      getData("transactions"),
      getData("snapshots"),
      tx.objectStore("settings").get(SETTINGS_KEY).catch(() => undefined),
      getData("properties"),
      getData("assets"),
      getData("investments"),
      getData("liabilities"),
      getData("incomes"),
      getData("budgets"),
      getData("recurringExpenses"),
      getData("stockItems"),
      getData("recipes"),
      getData("dogs"),
      getData("goals"),
      getData("wasteRecords"),
      getData("shoppingItems"),
      getData("calendarObligations"),
      getData("persons"),
      getData("households"),
      getData("personalGoals"),
    ]);
    await tx.done;
    return { settings: (settings as Settings | undefined) ?? null, transactions, snapshots, properties, assets, investments, liabilities, incomes, budgets, recurringExpenses, stockItems, recipes, dogs, goals, wasteRecords, shoppingItems, calendarObligations: calendarObligations ?? [], persons: persons ?? [], households: households ?? [], personalGoals: personalGoals ?? [] };
  }

  async addTransaction(t: Transaction): Promise<void> {
    await this.db.put("transactions", t);
  }

  // Výdavok sa maže spolu s prílohami, aby v úložisku nezostali osirelé súbory (D-160).
  async deleteTransaction(id: string): Promise<void> {
    const tx = this.db.transaction(["transactions", "attachments"], "readwrite");
    await tx.objectStore("transactions").delete(id);
    let cursor = await tx.objectStore("attachments").index("transactionId").openCursor(id);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  }

  async listAttachments(transactionId: string): Promise<Attachment[]> {
    return this.db.getAllFromIndex("attachments", "transactionId", transactionId);
  }

  async listAllAttachments(): Promise<Attachment[]> {
    return this.db.getAll("attachments");
  }

  async saveAttachment(a: Attachment): Promise<void> {
    await this.db.put("attachments", a);
  }

  async deleteAttachment(id: string): Promise<void> {
    await this.db.delete("attachments", id);
  }

  async listRentalAttachments(entryId: string): Promise<Attachment[]> {
    return this.db.getAllFromIndex("attachments", "rentalEntryId", entryId);
  }

  async deleteAttachmentsForRentalEntries(entryIds: string[]): Promise<void> {
    if (entryIds.length === 0) return;
    const tx = this.db.transaction("attachments", "readwrite");
    for (const entryId of entryIds) {
      let cursor = await tx.objectStore("attachments").index("rentalEntryId").openCursor(entryId);
      while (cursor) {
        await cursor.delete();
        cursor = await cursor.continue();
      }
    }
    await tx.done;
  }

  async replaceAttachments(list: Attachment[]): Promise<void> {
    // PHASE 1B: Ochrana REAL — hromadné zmazanie príloh je zakázané
    if (this.environment === "real") {
      throw new Error("❌ Zmazanie príloh je v REAL prostredí zakázané. Použite kontrolovaný import so zálohovaním.");
    }
    const tx = this.db.transaction("attachments", "readwrite");
    tx.done.catch(() => undefined);
    await tx.objectStore("attachments").clear();
    for (const a of list) await tx.objectStore("attachments").put(a);
    await tx.done;
  }

  async addSnapshot(s: Snapshot): Promise<void> {
    // Atomická transakcia s kontrolou duplicity pre automatické snapshoty
    const tx = this.db.transaction(["snapshots"], "readwrite");
    tx.done.catch(() => undefined);
    try {
      const store = tx.objectStore("snapshots");

      // PRE AUTOMATICKÉ SNAPSHOTY: Kontrola deduplikácie
      if (s.auto === true) {
        const allSnapshots = await store.getAll();
        // Existuje JUŽ automatický snapshot pre ROVNAKÝ mesiac (dátum)?
        const isDuplicate = allSnapshots.some((existing) =>
          existing.auto === true && existing.date === s.date
        );
        if (isDuplicate) {
          throw new Error(
            `Automatický snapshot za mesiac ${s.date} už existuje (deduplikácia)`
          );
        }
      }

      // PRE MANUÁLNE SNAPSHOTY: Bez kontroly, všetky sú povolené

      // Uloženie snapshotu
      await store.put(s);
      await tx.done;
    } catch (err) {
      try {
        tx.abort();
      } catch {
        // Ignoruj — transakcia je už ukončená
      }
      throw err;
    }
  }

  async deleteSnapshot(id: string): Promise<void> {
    await this.db.delete("snapshots", id);
  }

  async addManualSnapshot(s: Snapshot): Promise<void> {
    // OPRAVA B: Ručný snapshot nesmie vymazávať automatické snapshoty (D-116).
    // Používajte addSnapshot() pre všetky snapshoty (manuálne aj automatické).
    // Táto metóda je ponechaná pre spätnú kompatibilitu, ale bez mazania.
    const tx = this.db.transaction(["snapshots"], "readwrite");
    tx.done.catch(() => undefined);
    try {
      const store = tx.objectStore("snapshots");
      // Bezpečný zápis bez mazania iných snapshotov
      await store.put(s);
      await tx.done;
    } catch (err) {
      try { tx.abort(); } catch { /* už ukončená */ }
      throw err;
    }
  }

  async saveSettings(s: Settings): Promise<void> {
    await this.db.put("settings", s, SETTINGS_KEY);
  }

  // OPRAVA B.3: Atómická invalidácia potvrdení v jednej readwrite transakcii
  async invalidateConfirmations(): Promise<void> {
    const tx = this.db.transaction(["settings"], "readwrite");
    tx.done.catch(() => undefined);
    try {
      const store = tx.objectStore("settings");
      const current = await store.get(SETTINGS_KEY);
      if (current) {
        const updated = {
          ...current,
          propertiesConfirmed: false,
          liabilitiesConfirmed: false,
        };
        await store.put(updated, SETTINGS_KEY);
      }
      await tx.done;
    } catch (err) {
      try { tx.abort(); } catch { /* už ukončená */ }
      throw err;
    }
  }

  async saveProperty(p: Property): Promise<void> {
    await this.db.put("properties", p);
  }

  // OPRAVA B.4: Atómická operácia — uloženie nehnuteľnosti + invalidácia potvrdení v jednej transakcii
  async savePropertyAndInvalidate(p: Property): Promise<void> {
    const tx = this.db.transaction(["properties", "settings"], "readwrite");
    tx.done.catch(() => undefined);
    try {
      // 1. Ulož nehnuteľnosť
      const propsStore = tx.objectStore("properties");
      await propsStore.put(p);

      // 2. Načítaj Settings a invaliduj obe potvrdenia
      const settingsStore = tx.objectStore("settings");
      const current = await settingsStore.get(SETTINGS_KEY);
      if (current) {
        const updated = {
          ...current,
          propertiesConfirmed: false,
          liabilitiesConfirmed: false,
        };
        await settingsStore.put(updated, SETTINGS_KEY);
      }

      // 3. Dokončenie transakcie
      await tx.done;
    } catch (err) {
      try { tx.abort(); } catch { /* už ukončená */ }
      throw err;
    }
  }

  // Prílohy k výdavkom z prenájmu sa mažú spolu s nehnuteľnosťou (D-221). Pri chybe ostanú osirelé, nie stratené.
  async deleteProperty(id: string): Promise<void> {
    const ids = ((await this.db.get("properties", id))?.rentalLedger ?? []).map((e: RentalEntry) => e.id);
    await this.db.delete("properties", id);
    await this.deleteAttachmentsForRentalEntries(ids);
  }

  // OPRAVA B.5: Atomické mazanie nehnuteľnosti + invalidácia potvrdení v jednej transakcii
  async deletePropertyAndInvalidate(id: string): Promise<void> {
    // Načítaj rentalLedger IDs pred transakciou (rovnaké správanie ako deleteProperty)
    const rentalIds = ((await this.db.get("properties", id))?.rentalLedger ?? []).map((e: RentalEntry) => e.id);
    const tx = this.db.transaction(["properties", "settings"], "readwrite");
    tx.done.catch(() => undefined);
    try {
      await tx.objectStore("properties").delete(id);
      const current = await tx.objectStore("settings").get(SETTINGS_KEY);
      if (current) {
        await tx.objectStore("settings").put({
          ...current,
          propertiesConfirmed: false,
          liabilitiesConfirmed: false,
        }, SETTINGS_KEY);
      }
      await tx.done;
    } catch (err) {
      try { tx.abort(); } catch { /* už ukončená */ }
      throw err;
    }
    // Non-atomický cleanup príloh (rovnaké správanie ako deleteProperty — Pri chybe ostanú osirelé, nie stratené)
    await this.deleteAttachmentsForRentalEntries(rentalIds);
  }

  async saveAsset(a: Asset): Promise<void> {
    await this.db.put("assets", a);
  }

  async deleteAsset(id: string): Promise<void> {
    await this.db.delete("assets", id);
  }

  async savePosition(p: Position): Promise<void> {
    await this.db.put("investments", p);
  }

  async deletePosition(id: string): Promise<void> {
    await this.db.delete("investments", id);
  }

  async saveLiability(l: Liability): Promise<void> {
    await this.db.put("liabilities", l);
  }

  async deleteLiability(id: string): Promise<void> {
    await this.db.delete("liabilities", id);
  }

  // OPRAVA B.5: Atomické mazanie záväzku + invalidácia potvrdení v jednej transakcii
  async deleteLiabilityAndInvalidate(id: string): Promise<void> {
    const tx = this.db.transaction(["liabilities", "settings"], "readwrite");
    tx.done.catch(() => undefined);
    try {
      await tx.objectStore("liabilities").delete(id);
      const current = await tx.objectStore("settings").get(SETTINGS_KEY);
      if (current) {
        await tx.objectStore("settings").put({
          ...current,
          propertiesConfirmed: false,
          liabilitiesConfirmed: false,
        }, SETTINGS_KEY);
      }
      await tx.done;
    } catch (err) {
      try { tx.abort(); } catch { /* už ukončená */ }
      throw err;
    }
  }

  async saveIncome(i: RegularIncome): Promise<void> {
    await this.db.put("incomes", i);
  }

  async replaceIncomesFromSource(source: string, items: RegularIncome[]): Promise<void> {
    const tx = this.db.transaction("incomes", "readwrite");
    tx.done.catch(() => undefined);
    try {
      const store = tx.objectStore("incomes");
      for (const old of await store.getAll()) {
        if ((old as RegularIncome).source === source) await store.delete((old as RegularIncome).id);
      }
      for (const i of items) await store.put(i);
      await tx.done;
    } catch (err) {
      try { tx.abort(); } catch { /* už ukončená */ }
      throw err;
    }
  }

  async deleteIncome(id: string): Promise<void> {
    await this.db.delete("incomes", id);
  }

  async saveStockItem(i: StockItem): Promise<void> {
    await this.db.put("stockItems", i);
  }

  async deleteStockItem(id: string): Promise<void> {
    await this.db.delete("stockItems", id);
  }

  async applyStockChanges(items: StockItem[]): Promise<void> {
    const tx = this.db.transaction("stockItems", "readwrite");
    tx.done.catch(() => undefined);
    for (const i of items) await tx.store.put(i);
    await tx.done;
  }

  async discardStock(item: StockItem, record: WasteRecord): Promise<void> {
    const tx = this.db.transaction(["stockItems", "wasteRecords"], "readwrite");
    tx.done.catch(() => undefined);
    await tx.objectStore("stockItems").put(item);
    await tx.objectStore("wasteRecords").put(record);
    await tx.done;
  }

  async saveShoppingItems(items: ShoppingItem[]): Promise<void> {
    const tx = this.db.transaction("shoppingItems", "readwrite");
    tx.done.catch(() => undefined);
    for (const i of items) await tx.store.put(i);
    await tx.done;
  }

  async deleteShoppingItems(ids: string[]): Promise<void> {
    const tx = this.db.transaction("shoppingItems", "readwrite");
    tx.done.catch(() => undefined);
    for (const id of ids) await tx.store.delete(id);
    await tx.done;
  }

  async saveRecipe(r: Recipe): Promise<void> {
    await this.db.put("recipes", r);
  }

  async deleteRecipe(id: string): Promise<void> {
    await this.db.delete("recipes", id);
  }

  async saveGoal(g: InvestmentGoal): Promise<void> {
    await this.db.put("goals", g);
  }

  async deleteGoal(id: string): Promise<void> {
    await this.db.delete("goals", id);
  }

  async saveDog(d: Dog): Promise<void> {
    await this.db.put("dogs", d);
  }

  async deleteDog(id: string): Promise<void> {
    await this.db.delete("dogs", id);
  }

  async saveRecurringExpense(e: RecurringExpense): Promise<void> {
    await this.db.put("recurringExpenses", e);
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    await this.db.delete("recurringExpenses", id);
  }

  async saveBudget(b: Budget): Promise<void> {
    await this.db.put("budgets", b);
  }

  async deleteBudget(id: string): Promise<void> {
    await this.db.delete("budgets", id);
  }

  async replaceAll(data: AppData): Promise<void> {
    // PHASE 1B: Ochrana REAL — reset je zakázaný
    if (this.environment === "real") {
      throw new Error("❌ Reset databázy je v REAL prostredí zakázaný. Použite kontrolovaný import so zálohovaním.");
    }
    // V SANDBOX: normálne replaceAll bez príloh (kompatibilita s BackupForm)
    const stores = ["transactions", "snapshots", "settings", "properties", "assets", "investments", "liabilities", "incomes", "budgets", "recurringExpenses", "stockItems", "recipes", "dogs", "goals", "wasteRecords", "shoppingItems", "persons", "households", "personalGoals"];
    const tx = this.db.transaction(stores, "readwrite");
    tx.done.catch(() => undefined);
    try {
      await tx.objectStore("transactions").clear();
      await tx.objectStore("snapshots").clear();
      await tx.objectStore("settings").clear();
      await tx.objectStore("properties").clear();
      await tx.objectStore("assets").clear();
      await tx.objectStore("investments").clear();
      await tx.objectStore("liabilities").clear();
      await tx.objectStore("incomes").clear();
      await tx.objectStore("budgets").clear();
      await tx.objectStore("recurringExpenses").clear();
      await tx.objectStore("stockItems").clear();
      await tx.objectStore("recipes").clear();
      await tx.objectStore("dogs").clear();
      await tx.objectStore("goals").clear();
      await tx.objectStore("wasteRecords").clear();
      for (const w of data.wasteRecords) await tx.objectStore("wasteRecords").put(w);
      await tx.objectStore("shoppingItems").clear();
      for (const s of data.shoppingItems) await tx.objectStore("shoppingItems").put(s);
      await tx.objectStore("persons").clear();
      for (const p of (data.persons ?? [])) await tx.objectStore("persons").put(p);
      await tx.objectStore("households").clear();
      for (const h of (data.households ?? [])) await tx.objectStore("households").put(h);
      await tx.objectStore("personalGoals").clear();
      for (const g of (data.personalGoals ?? [])) await tx.objectStore("personalGoals").put(g);
      for (const b of data.budgets) await tx.objectStore("budgets").put(b);
      for (const e of data.recurringExpenses) await tx.objectStore("recurringExpenses").put(e);
      for (const i of data.stockItems) await tx.objectStore("stockItems").put(i);
      for (const r of data.recipes) await tx.objectStore("recipes").put(r);
      for (const d of data.dogs) await tx.objectStore("dogs").put(d);
      for (const g of data.goals) await tx.objectStore("goals").put(g);
      for (const i of data.incomes) await tx.objectStore("incomes").put(i);
      for (const l of data.liabilities) await tx.objectStore("liabilities").put(l);
      for (const i of data.investments) await tx.objectStore("investments").put(i);
      for (const p of data.properties) await tx.objectStore("properties").put(p);
      for (const a of data.assets) await tx.objectStore("assets").put(a);
      for (const t of data.transactions) await tx.objectStore("transactions").put(t);
      for (const s of data.snapshots) await tx.objectStore("snapshots").put(s);
      if (data.settings) await tx.objectStore("settings").put(data.settings, SETTINGS_KEY);
      await tx.done;
    } catch (err) {
      try { tx.abort(); } catch { /* už ukončená */ }
      throw err;
    }
  }

  async replaceAllWithAttachments(data: AppData, attachments: Attachment[]): Promise<void> {
    // PHASE 1B OPRAVA: V REAL je táto operácia blokovaná — musí sa používať replaceAllWithAttachmentsForRestore() so zálohovaním
    if (this.environment === "real") {
      throw new Error("❌ Priama hromadná náhrada je v REAL prostredí zakázaná. Použite kontrolovanú obnovu so zálohovaním.");
    }

    // V SANDBOX: normálna atomická transakcia
    await this._performAtomicReplace(data, attachments);
  }

  async replaceAllWithAttachmentsForRestore(data: AppData, attachments: Attachment[], _backupId: string): Promise<void> {
    // Ochrana REAL, fáza 1: import je v REAL zablokovaný, kým záloha nezachová všetky údaje (F-02, F-03).
    if (this.environment === "real") {
      throw new Error(REAL_IMPORT_BLOCKED_MESSAGE);
    }

    // Atomická transakcia — oboje (REAL aj SANDBOX)
    await this._performAtomicReplace(data, attachments);
  }

  private async _performAtomicReplace(data: AppData, attachments: Attachment[]): Promise<void> {
    // PHASE 1B: Ochrana REAL — TypeScript `private` je len compile-time; guard tu platí aj pri runtime volaní
    // cez (repo as any)._performAtomicReplace(...), konzolu prehliadača alebo injektovaný kód.
    if (this.environment === "real") {
      throw new Error("❌ Priama hromadná náhrada je v REAL prostredí zakázaná. Použite kontrolovanú obnovu so zálohovaním.");
    }
    // PHASE 1B: Atomická transakcia — dáta aj prílohy naraz (20 úložísk)
    const stores = ["transactions", "snapshots", "settings", "properties", "assets", "investments", "liabilities", "incomes", "budgets", "recurringExpenses", "stockItems", "recipes", "dogs", "goals", "wasteRecords", "shoppingItems", "persons", "households", "personalGoals", "attachments"];
    const tx = this.db.transaction(stores, "readwrite");
    tx.done.catch(() => undefined);
    try {
      // Vyčistit všetky tabuľky
      await tx.objectStore("transactions").clear();
      await tx.objectStore("snapshots").clear();
      await tx.objectStore("settings").clear();
      await tx.objectStore("properties").clear();
      await tx.objectStore("assets").clear();
      await tx.objectStore("investments").clear();
      await tx.objectStore("liabilities").clear();
      await tx.objectStore("incomes").clear();
      await tx.objectStore("budgets").clear();
      await tx.objectStore("recurringExpenses").clear();
      await tx.objectStore("stockItems").clear();
      await tx.objectStore("recipes").clear();
      await tx.objectStore("dogs").clear();
      await tx.objectStore("goals").clear();
      await tx.objectStore("wasteRecords").clear();
      await tx.objectStore("shoppingItems").clear();
      await tx.objectStore("persons").clear();
      await tx.objectStore("households").clear();
      await tx.objectStore("personalGoals").clear();
      await tx.objectStore("attachments").clear();
      // Vložiť nové dáta
      for (const w of data.wasteRecords) await tx.objectStore("wasteRecords").put(w);
      for (const s of data.shoppingItems) await tx.objectStore("shoppingItems").put(s);
      for (const p of (data.persons ?? [])) await tx.objectStore("persons").put(p);
      for (const h of (data.households ?? [])) await tx.objectStore("households").put(h);
      for (const g of (data.personalGoals ?? [])) await tx.objectStore("personalGoals").put(g);
      for (const b of data.budgets) await tx.objectStore("budgets").put(b);
      for (const e of data.recurringExpenses) await tx.objectStore("recurringExpenses").put(e);
      for (const i of data.stockItems) await tx.objectStore("stockItems").put(i);
      for (const r of data.recipes) await tx.objectStore("recipes").put(r);
      for (const d of data.dogs) await tx.objectStore("dogs").put(d);
      for (const g of data.goals) await tx.objectStore("goals").put(g);
      for (const i of data.incomes) await tx.objectStore("incomes").put(i);
      for (const l of data.liabilities) await tx.objectStore("liabilities").put(l);
      for (const i of data.investments) await tx.objectStore("investments").put(i);
      for (const p of data.properties) await tx.objectStore("properties").put(p);
      for (const a of data.assets) await tx.objectStore("assets").put(a);
      for (const t of data.transactions) await tx.objectStore("transactions").put(t);
      for (const s of data.snapshots) await tx.objectStore("snapshots").put(s);
      if (data.settings) await tx.objectStore("settings").put(data.settings, SETTINGS_KEY);
      for (const a of attachments) await tx.objectStore("attachments").put(a);
      await tx.done;
    } catch (err) {
      // Synchrónna chyba — rollback
      try { tx.abort(); } catch { /* už ukončená */ }
      throw err;
    }
  }

  async getMeta(key: string): Promise<string | null> {
    return ((await this.db.get("meta", key)) as string | undefined) ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    await this.db.put("meta", value, key);
  }

  async savePerson(p: Person): Promise<void> {
    await this.db.put("persons", p);
  }

  async deletePerson(id: string): Promise<void> {
    await this.db.delete("persons", id);
  }

  async saveHousehold(h: Household): Promise<void> {
    await this.db.put("households", h);
  }

  async deleteHousehold(id: string): Promise<void> {
    await this.db.delete("households", id);
  }

  async savePersonalGoal(g: PersonalGoal): Promise<void> {
    await this.db.put("personalGoals", g);
  }

  async deletePersonalGoal(id: string): Promise<void> {
    await this.db.delete("personalGoals", id);
  }

  close(): void {
    this.db.close();
  }
}
