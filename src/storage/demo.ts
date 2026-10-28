import type { Repository } from "./repository";
import type { AppData, Asset, Attachment, Budget, Dog, InvestmentGoal, Liability, Position, Property, Recipe, RecurringExpense, RegularIncome, Settings, ShoppingItem, Snapshot, StockItem, Transaction, WasteRecord } from "./types";
import { parseBackup } from "./backup";
import { todayIso } from "../ui/kit/format";

/**
 * Demo režim (D-343): in-memory repozitár inicializovaný z testovacia-zaloha.json.
 * Všetky zápisy idú do pamäti a po obnovení stránky sa stratia — žiadne trvalé uloženie.
 * IndexedDB používateľa zostáva nedotknutá.
 */
class MemoryRepository implements Repository {
  private d: AppData;
  private attachments: Attachment[] = [];
  private meta: Map<string, string> = new Map();

  constructor(data: AppData) {
    this.d = structuredClone(data);
  }

  async getData(): Promise<AppData> {
    return structuredClone(this.d);
  }

  async addTransaction(t: Transaction): Promise<void> {
    const idx = this.d.transactions.findIndex((x) => x.id === t.id);
    if (idx >= 0) this.d.transactions[idx] = t;
    else this.d.transactions.push(t);
  }

  async deleteTransaction(id: string): Promise<void> {
    this.d.transactions = this.d.transactions.filter((t) => t.id !== id);
    this.attachments = this.attachments.filter((a) => a.transactionId !== id);
  }

  async addSnapshot(s: Snapshot): Promise<void> {
    const idx = this.d.snapshots.findIndex((x) => x.id === s.id);
    if (idx >= 0) this.d.snapshots[idx] = s;
    else this.d.snapshots.push(s);
  }

  async addManualSnapshot(s: Snapshot): Promise<void> {
    this.d.snapshots = this.d.snapshots.filter((x) => !(x.auto && x.date >= s.date));
    await this.addSnapshot(s);
  }

  async deleteSnapshot(id: string): Promise<void> {
    this.d.snapshots = this.d.snapshots.filter((s) => s.id !== id);
  }

  async saveSettings(s: Settings): Promise<void> {
    this.d.settings = s;
  }

  async saveProperty(p: Property): Promise<void> {
    const idx = this.d.properties.findIndex((x) => x.id === p.id);
    if (idx >= 0) this.d.properties[idx] = p;
    else this.d.properties.push(p);
  }

  async deleteProperty(id: string): Promise<void> {
    this.d.properties = this.d.properties.filter((p) => p.id !== id);
  }

  async saveAsset(a: Asset): Promise<void> {
    const idx = this.d.assets.findIndex((x) => x.id === a.id);
    if (idx >= 0) this.d.assets[idx] = a;
    else this.d.assets.push(a);
  }

  async deleteAsset(id: string): Promise<void> {
    this.d.assets = this.d.assets.filter((a) => a.id !== id);
  }

  async savePosition(p: Position): Promise<void> {
    const idx = this.d.investments.findIndex((x) => x.id === p.id);
    if (idx >= 0) this.d.investments[idx] = p;
    else this.d.investments.push(p);
  }

  async deletePosition(id: string): Promise<void> {
    this.d.investments = this.d.investments.filter((p) => p.id !== id);
  }

  async saveGoal(g: InvestmentGoal): Promise<void> {
    const idx = this.d.goals.findIndex((x) => x.id === g.id);
    if (idx >= 0) this.d.goals[idx] = g;
    else this.d.goals.push(g);
  }

  async deleteGoal(id: string): Promise<void> {
    this.d.goals = this.d.goals.filter((g) => g.id !== id);
  }

  async saveLiability(l: Liability): Promise<void> {
    const idx = this.d.liabilities.findIndex((x) => x.id === l.id);
    if (idx >= 0) this.d.liabilities[idx] = l;
    else this.d.liabilities.push(l);
  }

  async deleteLiability(id: string): Promise<void> {
    this.d.liabilities = this.d.liabilities.filter((l) => l.id !== id);
  }

  async saveIncome(i: RegularIncome): Promise<void> {
    const idx = this.d.incomes.findIndex((x) => x.id === i.id);
    if (idx >= 0) this.d.incomes[idx] = i;
    else this.d.incomes.push(i);
  }

  async replaceIncomesFromSource(source: string, items: RegularIncome[]): Promise<void> {
    this.d.incomes = this.d.incomes.filter((i) => i.source !== source);
    this.d.incomes.push(...items);
  }

  async deleteIncome(id: string): Promise<void> {
    this.d.incomes = this.d.incomes.filter((i) => i.id !== id);
  }

  async saveBudget(b: Budget): Promise<void> {
    const idx = this.d.budgets.findIndex((x) => x.id === b.id);
    if (idx >= 0) this.d.budgets[idx] = b;
    else this.d.budgets.push(b);
  }

  async deleteBudget(id: string): Promise<void> {
    this.d.budgets = this.d.budgets.filter((b) => b.id !== id);
  }

  async saveRecurringExpense(e: RecurringExpense): Promise<void> {
    const idx = this.d.recurringExpenses.findIndex((x) => x.id === e.id);
    if (idx >= 0) this.d.recurringExpenses[idx] = e;
    else this.d.recurringExpenses.push(e);
  }

  async deleteRecurringExpense(id: string): Promise<void> {
    this.d.recurringExpenses = this.d.recurringExpenses.filter((e) => e.id !== id);
  }

  async saveStockItem(i: StockItem): Promise<void> {
    const idx = this.d.stockItems.findIndex((x) => x.id === i.id);
    if (idx >= 0) this.d.stockItems[idx] = i;
    else this.d.stockItems.push(i);
  }

  async deleteStockItem(id: string): Promise<void> {
    this.d.stockItems = this.d.stockItems.filter((i) => i.id !== id);
  }

  async applyStockChanges(items: StockItem[]): Promise<void> {
    for (const item of items) await this.saveStockItem(item);
  }

  async discardStock(item: StockItem, record: WasteRecord): Promise<void> {
    await this.saveStockItem(item);
    this.d.wasteRecords.push(record);
  }

  async saveShoppingItems(items: ShoppingItem[]): Promise<void> {
    for (const item of items) {
      const idx = this.d.shoppingItems.findIndex((x) => x.id === item.id);
      if (idx >= 0) this.d.shoppingItems[idx] = item;
      else this.d.shoppingItems.push(item);
    }
  }

  async deleteShoppingItems(ids: string[]): Promise<void> {
    const set = new Set(ids);
    this.d.shoppingItems = this.d.shoppingItems.filter((i) => !set.has(i.id));
  }

  async saveRecipe(r: Recipe): Promise<void> {
    const idx = this.d.recipes.findIndex((x) => x.id === r.id);
    if (idx >= 0) this.d.recipes[idx] = r;
    else this.d.recipes.push(r);
  }

  async deleteRecipe(id: string): Promise<void> {
    this.d.recipes = this.d.recipes.filter((r) => r.id !== id);
  }

  async saveDog(dg: Dog): Promise<void> {
    const idx = this.d.dogs.findIndex((x) => x.id === dg.id);
    if (idx >= 0) this.d.dogs[idx] = dg;
    else this.d.dogs.push(dg);
  }

  async deleteDog(id: string): Promise<void> {
    this.d.dogs = this.d.dogs.filter((d) => d.id !== id);
  }

  async listAttachments(transactionId: string): Promise<Attachment[]> {
    return this.attachments.filter((a) => a.transactionId === transactionId);
  }

  async listAllAttachments(): Promise<Attachment[]> {
    return [...this.attachments];
  }

  async saveAttachment(a: Attachment): Promise<void> {
    const idx = this.attachments.findIndex((x) => x.id === a.id);
    if (idx >= 0) this.attachments[idx] = a;
    else this.attachments.push(a);
  }

  async deleteAttachment(id: string): Promise<void> {
    this.attachments = this.attachments.filter((a) => a.id !== id);
  }

  async listRentalAttachments(entryId: string): Promise<Attachment[]> {
    return this.attachments.filter((a) => a.rentalEntryId === entryId);
  }

  async deleteAttachmentsForRentalEntries(entryIds: string[]): Promise<void> {
    const set = new Set(entryIds);
    this.attachments = this.attachments.filter((a) => !a.rentalEntryId || !set.has(a.rentalEntryId));
  }

  async replaceAttachments(list: Attachment[]): Promise<void> {
    this.attachments = [...list];
  }

  async replaceAll(data: AppData): Promise<void> {
    this.d = structuredClone(data);
  }

  async getMeta(_key: string): Promise<string | null> {
    return this.meta.get(_key) ?? null;
  }

  async setMeta(key: string, value: string): Promise<void> {
    this.meta.set(key, value);
  }

  close(): void {
    // in-memory, nič na zatváranie
  }
}

/** Načíta demo dáta zo zálohy a vráti in-memory repozitár (D-343). Nikdy nezapisuje do IndexedDB. */
export async function openDemoRepository(): Promise<Repository> {
  const res = await fetch("/testovacia-zaloha.json");
  if (!res.ok) throw new Error(`Demo dáta sa nepodarilo načítať (${res.status})`);
  const json: unknown = await res.json();
  const result = parseBackup(json, todayIso());
  if (!result.ok || !result.data) {
    const errs = result.ok ? [] : result.errors;
    throw new Error(`Demo dáta nie sú platné: ${errs.join(", ")}`);
  }
  return new MemoryRepository(result.data);
}
