import { openDB, type IDBPDatabase } from "idb";
import type { Repository } from "./repository";
import type { Asset, AppData, Budget, Liability, Position, Property, RegularIncome, Settings, Snapshot, Transaction } from "./types";

const DB_NAME = "financna-sloboda";
const DB_VERSION = 2; // 05 §4: verzia 1; verzia 2 pridáva úložisko majetku (FR-28)
const SETTINGS_KEY = "current";

/** Otvorí databázu s úložiskami z 05 §4. */
export async function openRepository(name: string = DB_NAME): Promise<Repository> {
  const db: IDBPDatabase = await openDB(name, DB_VERSION, {
    upgrade(d, oldVersion) {
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
    },
  });
  return new IdbRepository(db);
}

class IdbRepository implements Repository {
  constructor(private db: IDBPDatabase) {}

  async getData(): Promise<AppData> {
    const tx = this.db.transaction(["transactions", "snapshots", "settings", "properties", "assets", "investments", "liabilities", "incomes", "budgets"], "readonly");
    const [transactions, snapshots, settings, properties, assets, investments, liabilities, incomes, budgets] = await Promise.all([
      tx.objectStore("transactions").getAll(),
      tx.objectStore("snapshots").getAll(),
      tx.objectStore("settings").get(SETTINGS_KEY),
      tx.objectStore("properties").getAll(),
      tx.objectStore("assets").getAll(),
      tx.objectStore("investments").getAll(),
      tx.objectStore("liabilities").getAll(),
      tx.objectStore("incomes").getAll(),
      tx.objectStore("budgets").getAll(),
    ]);
    await tx.done;
    return { settings: (settings as Settings | undefined) ?? null, transactions, snapshots, properties, assets, investments, liabilities, incomes, budgets };
  }

  async addTransaction(t: Transaction): Promise<void> {
    await this.db.put("transactions", t);
  }

  async deleteTransaction(id: string): Promise<void> {
    await this.db.delete("transactions", id);
  }

  async addSnapshot(s: Snapshot): Promise<void> {
    await this.db.put("snapshots", s);
  }

  async saveSettings(s: Settings): Promise<void> {
    await this.db.put("settings", s, SETTINGS_KEY);
  }

  async saveProperty(p: Property): Promise<void> {
    await this.db.put("properties", p);
  }

  async deleteProperty(id: string): Promise<void> {
    await this.db.delete("properties", id);
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

  async saveBudget(b: Budget): Promise<void> {
    await this.db.put("budgets", b);
  }

  async deleteBudget(id: string): Promise<void> {
    await this.db.delete("budgets", id);
  }

  async replaceAll(data: AppData): Promise<void> {
    const tx = this.db.transaction(["transactions", "snapshots", "settings", "properties", "assets", "investments", "liabilities", "incomes", "budgets"], "readwrite");
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
      for (const b of data.budgets) await tx.objectStore("budgets").put(b);
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
