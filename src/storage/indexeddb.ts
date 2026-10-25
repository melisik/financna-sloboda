import { openDB, type IDBPDatabase } from "idb";
import type { Repository } from "./repository";
import type { Asset, AppData, Attachment, Budget, Dog, InvestmentGoal, Liability, Position, Property, Recipe, RentalEntry, RecurringExpense, RegularIncome, Settings, Snapshot, StockItem, Transaction, WasteRecord } from "./types";

const DB_NAME = "financna-sloboda";
const DB_VERSION = 10; // 05 §4: verzia 1; verzia 2 pridáva úložisko majetku (FR-28); verzia 5 recepty (D-127); verzia 6 psy (D-159); verzia 7 prílohy (D-160); verzia 8 prílohy k výdavkom z prenájmu (D-221); verzia 9 ciele investícií (D-105); verzia 10 vyhodené potraviny (D-301)
const SETTINGS_KEY = "current";

/** Otvorí databázu s úložiskami z 05 §4. */
export async function openRepository(name: string = DB_NAME): Promise<Repository> {
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
    },
  });
  return new IdbRepository(db);
}

class IdbRepository implements Repository {
  constructor(private db: IDBPDatabase) {}

  async getData(): Promise<AppData> {
    const tx = this.db.transaction(["transactions", "snapshots", "settings", "properties", "assets", "investments", "liabilities", "incomes", "budgets", "recurringExpenses", "stockItems", "recipes", "dogs", "goals", "wasteRecords"], "readonly");
    const [transactions, snapshots, settings, properties, assets, investments, liabilities, incomes, budgets, recurringExpenses, stockItems, recipes, dogs, goals, wasteRecords] = await Promise.all([
      tx.objectStore("transactions").getAll(),
      tx.objectStore("snapshots").getAll(),
      tx.objectStore("settings").get(SETTINGS_KEY),
      tx.objectStore("properties").getAll(),
      tx.objectStore("assets").getAll(),
      tx.objectStore("investments").getAll(),
      tx.objectStore("liabilities").getAll(),
      tx.objectStore("incomes").getAll(),
      tx.objectStore("budgets").getAll(),
      tx.objectStore("recurringExpenses").getAll(),
      tx.objectStore("stockItems").getAll(),
      tx.objectStore("recipes").getAll(),
      tx.objectStore("dogs").getAll(),
      tx.objectStore("goals").getAll(),
      tx.objectStore("wasteRecords").getAll(),
    ]);
    await tx.done;
    return { settings: (settings as Settings | undefined) ?? null, transactions, snapshots, properties, assets, investments, liabilities, incomes, budgets, recurringExpenses, stockItems, recipes, dogs, goals, wasteRecords };
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
    const tx = this.db.transaction("attachments", "readwrite");
    tx.done.catch(() => undefined);
    await tx.objectStore("attachments").clear();
    for (const a of list) await tx.objectStore("attachments").put(a);
    await tx.done;
  }

  async addSnapshot(s: Snapshot): Promise<void> {
    await this.db.put("snapshots", s);
  }

  async deleteSnapshot(id: string): Promise<void> {
    await this.db.delete("snapshots", id);
  }

  async addManualSnapshot(s: Snapshot): Promise<void> {
    const tx = this.db.transaction("snapshots", "readwrite");
    tx.done.catch(() => undefined);
    try {
      const store = tx.objectStore("snapshots");
      // Auto-vyhodnotenie, ktoré by prebilo ručný stav, sa zmaže; vznikne znova z nového stavu.
      for (const old of await store.getAll()) {
        if (old.auto && old.date >= s.date) await store.delete(old.id);
      }
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

  async saveProperty(p: Property): Promise<void> {
    await this.db.put("properties", p);
  }

  // Prílohy k výdavkom z prenájmu sa mažú spolu s nehnuteľnosťou (D-221). Pri chybe ostanú osirelé, nie stratené.
  async deleteProperty(id: string): Promise<void> {
    const ids = ((await this.db.get("properties", id))?.rentalLedger ?? []).map((e: RentalEntry) => e.id);
    await this.db.delete("properties", id);
    await this.deleteAttachmentsForRentalEntries(ids);
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
    const tx = this.db.transaction(["transactions", "snapshots", "settings", "properties", "assets", "investments", "liabilities", "incomes", "budgets", "recurringExpenses", "stockItems", "recipes", "dogs", "goals", "wasteRecords"], "readwrite");
    // Pri zrušení transakcie by tx.done odmietla promise bez poslucháča (neošetrená chyba).
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
      // Synchrónna chyba (napr. neplatný kľúč) by inak nechala transakciu commitnúť čiastočne.
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

  close(): void {
    this.db.close();
  }
}
