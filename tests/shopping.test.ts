import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { addToShoppingList, missingForRecipe, needsRestock, restockOffers, shoppingText } from "../src/domain/shopping";
import { openRepository } from "../src/storage/indexeddb";
import { buildBackup, parseBackup } from "../src/storage/backup";
import { validateAppData } from "../src/storage/validate";
import type { AppData, Recipe, ShoppingItem, StockItem } from "../src/storage/types";

// Nákupný zoznam (D-302, docs/51 etapa 2: 3.5, otázky 5 a 6). Syntetické dáta.
const TS = "2026-10-01T10:00:00Z";
const item = (o: Partial<StockItem> = {}): StockItem => ({ id: "s1", name: "Mlieko", quantity: 2, unit: "l", createdAt: TS, updatedAt: TS, ...o });
const shop = (o: Partial<ShoppingItem> = {}): ShoppingItem => ({ id: "n1", name: "Mlieko", done: false, createdAt: TS, updatedAt: TS, ...o });
const recipe: Recipe = { id: "r1", name: "Palacinky", ingredients: [{ stockItemId: "s1", quantity: 0.5, stockName: "Mlieko" }, { stockItemId: "s2", quantity: 3, stockName: "Vajcia" }], createdAt: TS, updatedAt: TS } as Recipe;
const empty: AppData = {
  settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [],
  recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [],
};

describe("kedy ponúknuť položku na zoznam", () => {
  it("bez minimálnej zásoby, keď došlo; s minimálnou zásobou, keď je pod ňou", () => {
    expect(needsRestock(item({ quantity: 0 }))).toBe(true);
    expect(needsRestock(item({ quantity: 0.5 }))).toBe(false);
    expect(needsRestock(item({ quantity: 1, minQuantity: 2 }))).toBe(true);
    expect(needsRestock(item({ quantity: 2, minQuantity: 2 }))).toBe(false);
  });

  it("ponuka len pri zmene do stavu na doplnenie a ak položka ešte nie je na zozname", () => {
    const before = [item({ id: "a", quantity: 1 }), item({ id: "b", name: "Chlieb", quantity: 1, unit: "ks" }), item({ id: "c", name: "Maslo", quantity: 0, unit: "ks" })];
    const after = [item({ id: "a", quantity: 0 }), item({ id: "b", name: "Chlieb", quantity: 0, unit: "ks" }), item({ id: "c", name: "Maslo", quantity: 0, unit: "ks" })];
    expect(restockOffers(before, after, [shop({ id: "x", name: "Chlieb", stockItemId: "b" })]).map((i) => i.id)).toEqual(["a"]);
  });
});

describe("zoznam", () => {
  it("chýbajúce suroviny receptu: rozdiel oproti skladu; chýbajúca položka celé množstvo", () => {
    const stock = [item({ id: "s1", quantity: 0.2 })];
    expect(missingForRecipe(recipe, stock)).toEqual([
      { name: "Mlieko", quantity: 0.3, unit: "l", stockItemId: "s1" },
      { name: "Vajcia", quantity: 3 },
    ]);
  });

  it("pridanie preskočí položku, ktorá už na zozname je (podľa položky skladu alebo názvu)", () => {
    const list = [shop({ id: "a", name: "Mlieko", stockItemId: "s1" }), shop({ id: "b", name: "chlieb" }), shop({ id: "c", name: "Syr", done: true })];
    const added = addToShoppingList(list, [{ name: "Mlieko", stockItemId: "s1" }, { name: "Chlieb" }, { name: "Syr" }, { name: "Vajcia", quantity: 3 }], TS, () => "new");
    expect(added.map((i) => i.name)).toEqual(["Syr", "Vajcia"]);
  });

  it("text na poslanie: len nekúpené položky", () => {
    expect(shoppingText([shop({ name: "Mlieko", quantity: 1.5, unit: "l" }), shop({ id: "b", name: "Chlieb" }), shop({ id: "c", name: "Syr", done: true })])).toBe("Nakúpiť:\n- Mlieko 1,5 l\n- Chlieb");
  });
});

describe("úložisko a záloha", () => {
  it("validácia minimálnej zásoby a položky zoznamu", () => {
    expect(validateAppData({ ...empty, stockItems: [item({ minQuantity: 1 })], shoppingItems: [shop({ quantity: 2, unit: "l", stockItemId: "s1" })] }, "2026-10-25").ok).toBe(true);
    expect(validateAppData({ ...empty, stockItems: [item({ minQuantity: -1 })] }, "2026-10-25").ok).toBe(false);
    expect(validateAppData({ ...empty, shoppingItems: [shop({ name: "" })] }, "2026-10-25").ok).toBe(false);
  });

  it("záloha v14 obsahuje zoznam; staršia sa načíta s prázdnym", () => {
    const backup = buildBackup({ ...empty, shoppingItems: [shop()] }, TS) as { schemaVersion: number };
    expect(backup.schemaVersion).toBe(16);
    expect(parseBackup(JSON.parse(JSON.stringify(backup)), "2026-10-25").data?.shoppingItems).toHaveLength(1);
    const { shoppingItems: _s, ...v13 } = { ...empty, app: "financna-sloboda", schemaVersion: 13, exportedAt: TS };
    expect(parseBackup(v13, "2026-10-25").data?.shoppingItems).toEqual([]);
  });

  it("uloženie a zmazanie položky zoznamu", async () => {
    const repo = await openRepository(`shop-${Math.random()}`);
    await repo.saveShoppingItems([shop(), shop({ id: "n2", name: "Chlieb" })]);
    await repo.deleteShoppingItems(["n1"]);
    expect((await repo.getData()).shoppingItems.map((i) => i.name)).toEqual(["Chlieb"]);
  });
});
