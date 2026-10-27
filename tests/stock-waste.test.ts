import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { mergedUnitPriceCents, receiptItemToStock, wasteSummary, wasteValueCents } from "../src/domain/waste";
import { openRepository } from "../src/storage/indexeddb";
import { buildBackup, parseBackup } from "../src/storage/backup";
import { validateAppData } from "../src/storage/validate";
import type { AppData, StockItem, WasteRecord } from "../src/storage/types";

// Sklad prepojený s výdavkami (D-301, docs/51 etapa 1): cena pri položke, prenos z dokladu, vyhodené. Syntetické dáta.
const TS = "2026-10-01T10:00:00Z";
const item = (o: Partial<StockItem> = {}): StockItem => ({ id: "s1", name: "Jogurt", quantity: 4, unit: "ks", createdAt: TS, updatedAt: TS, ...o });
const waste = (o: Partial<WasteRecord> = {}): WasteRecord => ({ id: "w1", date: "2026-10-10", name: "Jogurt", quantity: 1, unit: "ks", valueCents: 59, createdAt: TS, ...o });
const empty: AppData = {
  settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [],
  recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [],
};

describe("cena a vyhodené", () => {
  it("položka dokladu: množstvo z dokladu a cena za jednotku zo sumy riadku", () => {
    expect(receiptItemToStock({ code: "1", name: "JOGURT BIELY", quantity: 4, vatPercent: 5, unitPriceCents: 59, amountCents: 236 })).toEqual({ name: "JOGURT BIELY", quantity: 4, unitPriceCents: 59 });
    expect(receiptItemToStock({ code: "2", name: "RAJČINY", quantity: 0.532, vatPercent: 5, unitPriceCents: 299, amountCents: 159 })).toEqual({ name: "RAJČINY", quantity: 0.532, unitPriceCents: 299 });
  });

  it("hodnota vyhodeného: množstvo × cena za jednotku; bez ceny undefined", () => {
    expect(wasteValueCents(item({ unitPriceCents: 59 }), 2)).toBe(118);
    expect(wasteValueCents(item({ unit: "kg", unitPriceCents: 299 }), 0.25)).toBe(75);
    expect(wasteValueCents(item(), 1)).toBeUndefined();
  });

  it("pripočítanie rovnakého výrobku: cena je vážený priemer; bez novej ceny ostane stará", () => {
    expect(mergedUnitPriceCents(item({ quantity: 2, unitPriceCents: 50 }), 2, 70)).toBe(60);
    expect(mergedUnitPriceCents(item({ quantity: 2, unitPriceCents: 50 }), 2, undefined)).toBe(50);
    expect(mergedUnitPriceCents(item({ quantity: 2 }), 2, 70)).toBe(70);
    expect(mergedUnitPriceCents(item({ quantity: 0, unitPriceCents: 50 }), 3, 80)).toBe(80);
  });

  it("súhrn vyhodeného za mesiac a rok; položky bez ceny sa počítajú zvlášť", () => {
    const list = [waste({ id: "a", date: "2026-10-02", valueCents: 100 }), waste({ id: "b", date: "2026-10-20", valueCents: undefined }), waste({ id: "c", date: "2026-03-05", valueCents: 250 }), waste({ id: "d", date: "2025-12-31", valueCents: 999 })];
    expect(wasteSummary(list, "2026-10-25")).toEqual({ monthCents: 100, monthCount: 2, monthWithoutPrice: 1, yearCents: 350, yearCount: 3 });
  });
});

describe("úložisko a záloha", () => {
  it("validácia: cena a odkaz na výdavok pri položke; záznam vyhodeného", () => {
    expect(validateAppData({ ...empty, stockItems: [item({ unitPriceCents: 59, sourceTransactionId: "t1" })], wasteRecords: [waste()] }, "2026-10-25").ok).toBe(true);
    expect(validateAppData({ ...empty, stockItems: [item({ unitPriceCents: -1 })] }, "2026-10-25").ok).toBe(false);
    expect(validateAppData({ ...empty, wasteRecords: [waste({ quantity: 0 })] }, "2026-10-25").ok).toBe(false);
  });

  it("záloha v13 obsahuje vyhodené; staršia záloha bez nich sa načíta s prázdnym zoznamom", () => {
    const data = { ...empty, wasteRecords: [waste()] };
    const backup = buildBackup(data, TS) as { schemaVersion: number; wasteRecords: unknown[] };
    expect(backup.schemaVersion).toBe(17);
    expect(parseBackup(JSON.parse(JSON.stringify(backup)), "2026-10-25").data?.wasteRecords).toHaveLength(1);
    const { wasteRecords: _w, ...v12 } = { ...data, app: "financna-sloboda", schemaVersion: 12, exportedAt: TS };
    expect(parseBackup(v12, "2026-10-25").data?.wasteRecords).toEqual([]);
  });

  it("vyhodenie zníži množstvo a zapíše záznam naraz", async () => {
    const repo = await openRepository(`waste-${Math.random()}`);
    await repo.saveStockItem(item({ unitPriceCents: 59 }));
    await repo.discardStock({ ...item({ unitPriceCents: 59 }), quantity: 3 }, waste());
    const all = await repo.getData();
    expect(all.stockItems[0].quantity).toBe(3);
    expect(all.wasteRecords).toEqual([waste()]);
  });
});
