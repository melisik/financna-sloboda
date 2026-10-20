import type { AppData, Snapshot, Transaction, Settings } from "./types";

/** Rozhranie úložiska (05 §3): aplikácia a doména nevidia, či ide o IndexedDB. */
export interface Repository {
  getData(): Promise<AppData>;
  addTransaction(t: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;
  addSnapshot(s: Snapshot): Promise<void>;
  deleteSnapshot(id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  /** Nahradí všetky dáta v jednej transakcii; pri chybe zostanú pôvodné dáta (FR-18, D-018). */
  replaceAll(data: AppData): Promise<void>;
  getMeta(key: string): Promise<string | null>;
  setMeta(key: string, value: string): Promise<void>;
  close(): void;
}
