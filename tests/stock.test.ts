import { describe, expect, it } from "vitest";
import { daysUntil, expiringItems, sortForList, stockStatus } from "../src/domain/stock";
import { parseBackup } from "../src/storage/backup";
import { validateStockItem } from "../src/storage/validate";
import type { StockItem } from "../src/storage/types";

// Sklad potravín (samostatná sekcia). Syntetické hodnoty.
const base = { createdAt: "2026-10-20T10:00:00.000Z", updatedAt: "2026-10-20T10:00:00.000Z", quantity: 1, unit: "ks" as const };
const milk: StockItem = { ...base, id: "a", name: "mlieko", unit: "l", expiryDate: "2026-10-21" };
const bread: StockItem = { ...base, id: "b", name: "chlieb", expiryDate: "2026-10-19" };
const rice: StockItem = { ...base, id: "c", name: "ryža", unit: "g", quantity: 500 };
const later: StockItem = { ...base, id: "d", name: "konzerva", expiryDate: "2027-01-01" };

describe("sklad potravín", () => {
  it("dni do dátumu sú správne aj cez prechod mesiaca", () => {
    expect(daysUntil("2026-10-20", "2026-10-21")).toBe(1);
    expect(daysUntil("2026-10-20", "2026-10-19")).toBe(-1);
    expect(daysUntil("2026-10-30", "2026-11-02")).toBe(3);
  });

  it("stav: prešlo, blíži sa (do 3 dní), v poriadku, bez dátumu", () => {
    expect(stockStatus(bread, "2026-10-20")).toBe("prešlo");
    expect(stockStatus(milk, "2026-10-20")).toBe("blizi_sa");
    expect(stockStatus(later, "2026-10-20")).toBe("v_poriadku");
    expect(stockStatus(rice, "2026-10-20")).toBe("bez_datumu");
  });

  it("upozornenia obsahujú prešlé a blížiace sa položky, najskôr končiace hore", () => {
    expect(expiringItems([later, milk, rice, bread], "2026-10-20").map((i) => i.name)).toEqual(["chlieb", "mlieko"]);
  });

  it("položka, ktorá došla (množstvo 0), sa neupozorní ani keď jej dátum prešiel", () => {
    expect(expiringItems([{ ...bread, quantity: 0 }], "2026-10-20")).toEqual([]);
  });

  it("zoznam: prešlé, blížiace sa, v poriadku, bez dátumu a nakoniec došlo; v skupine skorší dátum prvý", () => {
    const gone = { ...base, id: "e", name: "jogurt", expiryDate: "2026-10-15" };
    const dateless = { ...base, id: "f", name: "soľ" };
    const empty = { ...base, id: "g", name: "cukor", quantity: 0, expiryDate: "2026-10-15" };
    const sooner = { ...base, id: "h", name: "maslo", expiryDate: "2026-10-22" };
    const names = sortForList([empty, dateless, later, sooner, rice, milk, gone, bread], "2026-10-20").map((i) => i.name);
    expect(names).toEqual(["jogurt", "chlieb", "mlieko", "maslo", "konzerva", "ryža", "soľ", "cukor"]);
  });

  it("validácia odmietne jednotku mimo katalógu a neplatný dátum", () => {
    expect(validateStockItem({ ...milk, unit: "kus" }, "položka").some((e) => e.includes("jednotka"))).toBe(true);
    expect(validateStockItem({ ...milk, expiryDate: "2026-13-40" }, "položka").length).toBeGreaterThan(0);
    expect(validateStockItem(milk, "položka")).toEqual([]);
  });

  it("staršia záloha bez skladu sa načíta s prázdnym zoznamom", () => {
    const v3: any = parseBackup({ app: "financna-sloboda", schemaVersion: 3, exportedAt: "x", settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [] }, "2026-10-20");
    expect(v3.ok).toBe(true);
    expect(v3.data.stockItems).toEqual([]);
  });
});
