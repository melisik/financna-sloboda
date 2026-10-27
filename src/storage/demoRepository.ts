/**
 * In-memory repozitár pre demo režim (D-343).
 * Načíta DEMO_APP_DATA a drží ho v pamäti; všetky zápisy sú no-op.
 */
import type { Repository } from "./repository";
import type { AppData, Asset, Attachment, Budget, Dog, InvestmentGoal, Liability, Position, Property, Recipe, RecurringExpense, RegularIncome, Settings, ShoppingItem, Snapshot, StockItem, Transaction, WasteRecord } from "./types";
import { DEMO_APP_DATA } from "./demoData";

function cloneData(d: AppData): AppData {
  return JSON.parse(JSON.stringify(d)) as AppData;
}

export function createDemoRepository(): Repository {
  let data: AppData = cloneData(DEMO_APP_DATA);

  return {
    async getData() { return cloneData(data); },

    async addTransaction(t: Transaction) { data.transactions.push(t); },
    async deleteTransaction(id: string) { data.transactions = data.transactions.filter((x) => x.id !== id); },

    async addSnapshot(s: Snapshot) { data.snapshots.push(s); },
    async addManualSnapshot(s: Snapshot) {
      data.snapshots = data.snapshots.filter((x) => x.date < s.date);
      data.snapshots.push(s);
    },
    async deleteSnapshot(id: string) { data.snapshots = data.snapshots.filter((x) => x.id !== id); },

    async saveSettings(s: Settings) { data.settings = s; },

    async saveProperty(p: Property) {
      const idx = data.properties.findIndex((x) => x.id === p.id);
      if (idx >= 0) data.properties[idx] = p; else data.properties.push(p);
    },
    async deleteProperty(id: string) { data.properties = data.properties.filter((x) => x.id !== id); },

    async saveAsset(a: Asset) {
      const idx = data.assets.findIndex((x) => x.id === a.id);
      if (idx >= 0) data.assets[idx] = a; else data.assets.push(a);
    },
    async deleteAsset(id: string) { data.assets = data.assets.filter((x) => x.id !== id); },

    async savePosition(p: Position) {
      const idx = data.investments.findIndex((x) => x.id === p.id);
      if (idx >= 0) data.investments[idx] = p; else data.investments.push(p);
    },
    async deletePosition(id: string) { data.investments = data.investments.filter((x) => x.id !== id); },

    async saveGoal(g: InvestmentGoal) {
      const idx = data.goals.findIndex((x) => x.id === g.id);
      if (idx >= 0) data.goals[idx] = g; else data.goals.push(g);
    },
    async deleteGoal(id: string) { data.goals = data.goals.filter((x) => x.id !== id); },

    async saveLiability(l: Liability) {
      const idx = data.liabilities.findIndex((x) => x.id === l.id);
      if (idx >= 0) data.liabilities[idx] = l; else data.liabilities.push(l);
    },
    async deleteLiability(id: string) { data.liabilities = data.liabilities.filter((x) => x.id !== id); },

    async saveIncome(i: RegularIncome) {
      const idx = data.incomes.findIndex((x) => x.id === i.id);
      if (idx >= 0) data.incomes[idx] = i; else data.incomes.push(i);
    },
    async replaceIncomesFromSource(source: string, items: RegularIncome[]) {
      data.incomes = [...data.incomes.filter((x) => x.source !== source), ...items];
    },
    async deleteIncome(id: string) { data.incomes = data.incomes.filter((x) => x.id !== id); },

    async saveBudget(b: Budget) {
      const idx = data.budgets.findIndex((x) => x.id === b.id);
      if (idx >= 0) data.budgets[idx] = b; else data.budgets.push(b);
    },
    async deleteBudget(id: string) { data.budgets = data.budgets.filter((x) => x.id !== id); },

    async saveRecurringExpense(e: RecurringExpense) {
      const idx = data.recurringExpenses.findIndex((x) => x.id === e.id);
      if (idx >= 0) data.recurringExpenses[idx] = e; else data.recurringExpenses.push(e);
    },
    async deleteRecurringExpense(id: string) { data.recurringExpenses = data.recurringExpenses.filter((x) => x.id !== id); },

    async saveStockItem(i: StockItem) {
      const idx = data.stockItems.findIndex((x) => x.id === i.id);
      if (idx >= 0) data.stockItems[idx] = i; else data.stockItems.push(i);
    },
    async deleteStockItem(id: string) { data.stockItems = data.stockItems.filter((x) => x.id !== id); },
    async applyStockChanges(items: StockItem[]) {
      for (const item of items) {
        const idx = data.stockItems.findIndex((x) => x.id === item.id);
        if (idx >= 0) data.stockItems[idx] = item;
      }
    },
    async discardStock(item: StockItem, record: WasteRecord) {
      const idx = data.stockItems.findIndex((x) => x.id === item.id);
      if (idx >= 0) data.stockItems[idx] = item;
      data.wasteRecords.push(record);
    },

    async saveShoppingItems(items: ShoppingItem[]) {
      for (const item of items) {
        const idx = data.shoppingItems.findIndex((x) => x.id === item.id);
        if (idx >= 0) data.shoppingItems[idx] = item; else data.shoppingItems.push(item);
      }
    },
    async deleteShoppingItems(ids: string[]) {
      const set = new Set(ids);
      data.shoppingItems = data.shoppingItems.filter((x) => !set.has(x.id));
    },

    async saveRecipe(r: Recipe) {
      const idx = data.recipes.findIndex((x) => x.id === r.id);
      if (idx >= 0) data.recipes[idx] = r; else data.recipes.push(r);
    },
    async deleteRecipe(id: string) { data.recipes = data.recipes.filter((x) => x.id !== id); },

    async saveDog(d: Dog) {
      const idx = data.dogs.findIndex((x) => x.id === d.id);
      if (idx >= 0) data.dogs[idx] = d; else data.dogs.push(d);
    },
    async deleteDog(id: string) { data.dogs = data.dogs.filter((x) => x.id !== id); },

    async listAttachments() { return []; },
    async listAllAttachments() { return []; },
    async saveAttachment(_a: Attachment) {},
    async deleteAttachment(_id: string) {},
    async listRentalAttachments() { return []; },
    async deleteAttachmentsForRentalEntries() {},
    async replaceAttachments() {},

    async replaceAll(d: AppData) { data = cloneData(d); },

    async getMeta(_key: string) { return null; },
    async setMeta(_key: string, _value: string) {},

    close() {},
  };
}
