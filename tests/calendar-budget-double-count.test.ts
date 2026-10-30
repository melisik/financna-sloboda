import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  applyPayment,
  budgetCountedTransactions,
  buildPaymentTransaction,
  calendarLinkErrors,
  newObligation,
  obligationsForMonth,
} from "../src/domain/calendarObligation";
import { monthSummary } from "../src/domain/monthSummary";
import { openRepository } from "../src/storage/indexeddb";
import { createDemoRepository } from "../src/storage/demoRepository";
import type { Repository } from "../src/storage/repository";
import type { AppData, Budget, CalendarObligation, RecurringExpense } from "../src/storage/types";

/**
 * D-345: platba povinnosti odvodenej z pravidelného výdavku sa v rozpočte nerátá druhýkrát.
 * Pravidelný výdavok je v mesačnom využití kategórie už zahrnutý (D-124); transakcia z kalendára má rovnakú kategóriu.
 */
const TODAY = "2026-10-30";
const NOW = "2026-10-30T10:00:00Z";
let seq = 0;
const freshName = () => `cal-dc-${++seq}-${Math.random().toString(36).slice(2)}`;

const recurring = (over: Partial<RecurringExpense> = {}): RecurringExpense => ({
  id: "r1", name: "Nájom", category: "bývanie", frequency: "mesacne", amountCents: 50000, startDate: "2026-01-01", dayOfMonth: 15,
  createdAt: NOW, updatedAt: NOW, ...over,
});
const budget: Budget = { id: "bývanie", category: "bývanie", limitCents: 100000, updatedAt: NOW };

function emptyData(): AppData {
  return {
    settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [],
    recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [], calendarObligations: [],
  };
}
const spent = (d: AppData) => monthSummary(d.transactions, [budget], d.recurringExpenses, TODAY, 0, d.properties, d.liabilities, d.calendarObligations).plannedSpentCents;
const virtualOf = (d: AppData) => obligationsForMonth(d.recurringExpenses, d.calendarObligations, "2026-10", TODAY).find((o) => o.recurringExpenseId === "r1")!;

const factories: [string, () => Promise<Repository>][] = [
  ["IndexedDB", () => openRepository(freshName())],
  ["demo", async () => { const r = createDemoRepository(); await r.replaceAll(emptyData()); return r; }],
];

async function payRecurring(repo: Repository, d: AppData, amountCents = 50000) {
  const base: CalendarObligation = { ...virtualOf(d), id: `ob-${Math.random().toString(36).slice(2)}` };
  const t = buildPaymentTransaction(base, { date: TODAY, amountCents, source: "z_prijmu" });
  const res = await repo.payCalendarObligation(applyPayment(base, t, TODAY), t);
  return { t, base, res };
}

describe.each(factories)("D-345: rozpočet bez dvojitého započítania (%s)", (_n, make) => {
  async function withRecurring() {
    const repo = await make();
    await repo.replaceAll({ ...emptyData(), recurringExpenses: [recurring()], budgets: [budget] });
    return repo;
  }

  it("nezaplatená pravidelná povinnosť: rozpočet ráta pravidelný výdavok raz", async () => {
    const repo = await withRecurring();
    const d = await repo.getData();
    expect(virtualOf(d).status).not.toBe("zaplatene");
    expect(d.transactions).toHaveLength(0);
    expect(spent(d)).toBe(50000);
  });

  it("zaplatená pravidelná povinnosť: transakcia vznikne, ale rozpočet ostáva na 50 000 (nie 100 000)", async () => {
    const repo = await withRecurring();
    const { t, res } = await payRecurring(repo, await repo.getData());
    expect(res).toEqual({ created: true });
    const d = await repo.getData();
    expect(d.transactions.map((x) => x.id)).toEqual([t.id]);
    expect(d.transactions[0]).toMatchObject({ category: "bývanie", amountCents: 50000, type: "vydavok" });
    // bez opravy by tu bolo 100000 (pravidelný výdavok + transakcia z kalendára)
    expect(spent(d)).toBe(50000);
    expect(calendarLinkErrors(d.calendarObligations, d.transactions)).toEqual([]);
  });

  it("dôkaz pôvodnej chyby: bez informácie o povinnostiach by sa tá istá platba započítala dvakrát", async () => {
    const repo = await withRecurring();
    await payRecurring(repo, await repo.getData());
    const d = await repo.getData();
    const withoutObligations = monthSummary(d.transactions, [budget], d.recurringExpenses, TODAY, 0, d.properties, d.liabilities).plannedSpentCents;
    expect(withoutObligations).toBe(100000);
    expect(spent(d)).toBe(50000);
  });

  it("opakované potvrdenie platby nevytvorí druhú transakciu ani druhé započítanie", async () => {
    const repo = await withRecurring();
    const first = await payRecurring(repo, await repo.getData());
    const stored = (await repo.getData()).calendarObligations[0];
    const t2 = buildPaymentTransaction(stored, { date: TODAY, amountCents: 50000, source: "z_prijmu" });
    expect(await repo.payCalendarObligation(applyPayment(stored, t2, TODAY), t2)).toEqual({ created: false });
    const d = await repo.getData();
    expect(d.transactions.map((x) => x.id)).toEqual([first.t.id]);
    expect(spent(d)).toBe(50000);
  });

  it("bezpečné vrátenie: zrušenie zaplatenia odstráni len prepojenú transakciu a rozpočet sa nezmení", async () => {
    const repo = await withRecurring();
    const other = { id: "tx-other", date: "2026-10-02", type: "vydavok" as const, amountCents: 2000, source: "z_prijmu" as const, category: "bývanie" as const, createdAt: NOW, updatedAt: NOW };
    await repo.addTransaction(other);
    const { base } = await payRecurring(repo, await repo.getData());
    expect(spent(await repo.getData())).toBe(52000);
    await repo.unpayCalendarObligation(base.id);
    const d = await repo.getData();
    expect(d.transactions.map((x) => x.id)).toEqual(["tx-other"]);
    expect(d.calendarObligations[0]).toMatchObject({ status: "caka" });
    expect(d.calendarObligations[0].transactionId).toBeUndefined();
    expect(spent(d)).toBe(52000);
  });

  it("ručná transakcia bez prepojenia sa započíta (nie je to platba z kalendára)", async () => {
    const repo = await withRecurring();
    await repo.addTransaction({ id: "tx-manual", date: "2026-10-10", type: "vydavok", amountCents: 7000, source: "z_prijmu", category: "bývanie", createdAt: NOW, updatedAt: NOW });
    expect(spent(await repo.getData())).toBe(57000);
  });
});

describe("D-345: budgetCountedTransactions", () => {
  const tx = (id: string, obId?: string) => ({ id, date: "2026-10-15", type: "vydavok" as const, amountCents: 100, source: "z_prijmu" as const, category: "bývanie" as const, calendarObligationId: obId, createdAt: NOW, updatedAt: NOW });
  const linked = (recId?: string): CalendarObligation => ({ ...newObligation({ name: "N", category: "bývanie", amountCents: 100, dueDate: "2026-10-15" }), id: "ob", recurringExpenseId: recId, status: "zaplatene" });

  it("jednorazová povinnosť: jej platba je jediný zápis, preto sa započíta", () => {
    const ts = [tx("t1", "ob")];
    expect(budgetCountedTransactions(ts, [linked()], [recurring()], TODAY)).toEqual(ts);
  });
  it("pravidelná povinnosť s platným pravidelným výdavkom: platba sa nerátá", () => {
    expect(budgetCountedTransactions([tx("t1", "ob"), tx("t2")], [linked("r1")], [recurring()], TODAY).map((t) => t.id)).toEqual(["t2"]);
  });
  it("pravidelný výdavok zmazaný alebo už neplatný: platba sa započíta, inak by nebola nikde", () => {
    const ts = [tx("t1", "ob")];
    expect(budgetCountedTransactions(ts, [linked("r1")], [], TODAY)).toEqual(ts);
    expect(budgetCountedTransactions(ts, [linked("r1")], [recurring({ endDate: "2026-09-30" })], TODAY)).toEqual(ts);
  });
  it("bez povinností vráti rovnaký zoznam a vstup nemení", () => {
    const ts = [tx("t1", "ob")];
    expect(budgetCountedTransactions(ts, [], [recurring()], TODAY)).toBe(ts);
    budgetCountedTransactions(ts, [linked("r1")], [recurring()], TODAY);
    expect(ts).toHaveLength(1);
  });
});
