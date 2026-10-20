import { openDB, type IDBPDatabase } from "idb";
import type { Repository } from "./repository";
import type { AppData, Settings, Snapshot, Transaction } from "./types";

const DB_NAME = "financna-sloboda";
const DB_VERSION = 1; // 05 §4: databáza financna-sloboda, verzia 1
const SETTINGS_KEY = "current";

/** Otvorí databázu s úložiskami z 05 §4. */
export async function openRepository(name: string = DB_NAME): Promise<Repository> {
  const db: IDBPDatabase = await openDB(name, DB_VERSION, {
    upgrade(d) {
      const tx = d.createObjectStore("transactions", { keyPath: "id" });
      tx.createIndex("date", "date");
      tx.createIndex("type", "type");
      d.createObjectStore("snapshots", { keyPath: "id" }).createIndex("date", "date");
      d.createObjectStore("settings");
      d.createObjectStore("meta");
    },
  });
  return new IdbRepository(db);
}

class IdbRepository implements Repository {
  constructor(private db: IDBPDatabase) {}

  async getData(): Promise<AppData> {
    const tx = this.db.transaction(["transactions", "snapshots", "settings"], "readonly");
    const [transactions, snapshots, settings] = await Promise.all([
      tx.objectStore("transactions").getAll(),
      tx.objectStore("snapshots").getAll(),
      tx.objectStore("settings").get(SETTINGS_KEY),
    ]);
    await tx.done;
    return { settings: (settings as Settings | undefined) ?? null, transactions, snapshots };
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

  async deleteSnapshot(id: string): Promise<void> {
    await this.db.delete("snapshots", id);
  }

  async saveSettings(s: Settings): Promise<void> {
    await this.db.put("settings", s, SETTINGS_KEY);
  }

  async replaceAll(data: AppData): Promise<void> {
    const tx = this.db.transaction(["transactions", "snapshots", "settings"], "readwrite");
    // Pri zrušení transakcie by tx.done odmietla promise bez poslucháča (neošetrená chyba).
    tx.done.catch(() => undefined);
    try {
      await tx.objectStore("transactions").clear();
      await tx.objectStore("snapshots").clear();
      await tx.objectStore("settings").clear();
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
