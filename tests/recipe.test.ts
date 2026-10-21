import { describe, expect, it } from "vitest";
import { cookRecipe } from "../src/domain/recipe";
import { parseBackup, buildBackup } from "../src/storage/backup";
import { validateRecipe, validateStockItem } from "../src/storage/validate";
import type { AppData, Recipe, StockItem } from "../src/storage/types";

// Recepty a odpočet skladu (D-127). Syntetické hodnoty.
const TODAY = "2026-10-20";
const NOW = "2026-10-20T10:00:00Z";
const base = { createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z" };
const milk: StockItem = { ...base, id: "m", name: "mlieko", quantity: 2, unit: "l" };
const rice: StockItem = { ...base, id: "r", name: "ryža", quantity: 500, unit: "g" };
const stock = [milk, rice];

const porridge: Recipe = { ...base, id: "k", name: "kaša", ingredients: [{ stockItemId: "m", quantity: 0.5 }, { stockItemId: "r", quantity: 100 }] };

describe("uvarenie receptu", () => {
  it("odpočíta suroviny v jednotke položky skladu a mení len ich", () => {
    const res = cookRecipe(porridge, stock, NOW);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.changed.map((i) => [i.name, i.quantity, i.unit])).toEqual([["mlieko", 1.5, "l"], ["ryža", 400, "g"]]);
    expect(res.changed[0].updatedAt).toBe(NOW);
  });

  it("chýbajúca surovina zablokuje celý odpočet a pomenuje, čo chýba", () => {
    const big: Recipe = { ...porridge, ingredients: [{ stockItemId: "m", quantity: 0.5 }, { stockItemId: "r", quantity: 600 }] };
    const res = cookRecipe(big, stock, NOW);
    expect(res).toEqual({ ok: false, problems: ["ryža: chýba 100 g"] });
  });

  it("surovina, ktorá už nie je v sklade, sa nahlási aj s názvom uloženým v recepte", () => {
    const gone: Recipe = { ...porridge, ingredients: [{ stockItemId: "x", quantity: 1, stockName: "špagety" }] };
    expect(cookRecipe(gone, stock, NOW)).toEqual({ ok: false, problems: ["„špagety“ už nie je v sklade"] });
  });

  it("staršia surovina bez uloženého názvu sa nahlási všeobecne", () => {
    const gone: Recipe = { ...porridge, ingredients: [{ stockItemId: "x", quantity: 1 }] };
    expect(cookRecipe(gone, stock, NOW)).toEqual({ ok: false, problems: ["Niektorá surovina už nie je v sklade"] });
  });

  it("presne použité množstvo nechá stav 0 a ten je platný", () => {
    const all: Recipe = { ...porridge, ingredients: [{ stockItemId: "r", quantity: 500 }] };
    const res = cookRecipe(all, stock, NOW);
    expect(res.ok && res.changed[0].quantity).toBe(0);
    expect(validateStockItem({ ...rice, quantity: 0 }, "položka")).toEqual([]);
  });

  it("rovnaká surovina v recepte dvakrát sa sčíta", () => {
    const twice: Recipe = { ...porridge, ingredients: [{ stockItemId: "r", quantity: 300 }, { stockItemId: "r", quantity: 250 }] };
    expect(cookRecipe(twice, stock, NOW)).toEqual({ ok: false, problems: ["ryža: chýba 50 g"] });
  });
});

describe("validácia a záloha receptov", () => {
  it("recept musí mať názov a aspoň jednu surovinu s kladným množstvom", () => {
    expect(validateRecipe(porridge)).toEqual([]);
    expect(validateRecipe({ ...porridge, ingredients: [] }).length).toBeGreaterThan(0);
    expect(validateRecipe({ ...porridge, name: "  " }).length).toBeGreaterThan(0);
    expect(validateRecipe({ ...porridge, ingredients: [{ stockItemId: "m", quantity: 0 }] }).length).toBeGreaterThan(0);
    expect(validateRecipe({ ...porridge, ingredients: [{ stockItemId: "m", quantity: 1, stockName: "mlieko" }] })).toEqual([]);
    expect(validateRecipe({ ...porridge, ingredients: [{ stockItemId: "m", quantity: 1, stockName: 5 }] }).join(" ")).toMatch(/názov suroviny/);
  });

  it("export a import zachová recepty a staršia záloha ich načíta prázdne", () => {
    const data: AppData = {
      settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [],
      incomes: [], budgets: [], recurringExpenses: [], stockItems: [milk, rice], recipes: [porridge],
    };
    const backup = JSON.parse(JSON.stringify(buildBackup(data, NOW)));
    const parsed = parseBackup(backup, TODAY);
    expect(parsed.ok && parsed.data?.recipes).toEqual([porridge]);

    const v4: any = parseBackup({ app: "financna-sloboda", schemaVersion: 4, exportedAt: "x", settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], stockItems: [] }, TODAY);
    expect(v4.ok).toBe(true);
    expect(v4.data.recipes).toEqual([]);
  });
});
