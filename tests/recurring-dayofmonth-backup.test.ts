import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { applyPayment, buildPaymentTransaction, calendarLinkErrors, obligationsForMonth, recurringDueDate } from "../src/domain/calendarObligation";
import { buildBackup, parseBackup } from "../src/storage/backup";
import { openRepository } from "../src/storage/indexeddb";
import { createDemoRepository } from "../src/storage/demoRepository";
import type { Repository } from "../src/storage/repository";
import type { AppData, RecurringExpense } from "../src/storage/types";

/** D-345: deň splatnosti pravidelného výdavku prežije zálohu, import, úpravu a uloženie; staršie záznamy bez dňa ostávajú bez dňa. */
const TODAY = "2026-10-30";
const NOW = "2026-10-30T10:00:00Z";
const rec = (id: string, over: Partial<RecurringExpense> = {}): RecurringExpense => ({
  id, name: id, category: "bývanie", frequency: "mesacne", amountCents: 50000, startDate: "2026-01-01", createdAt: NOW, updatedAt: NOW, ...over,
});
function emptyData(): AppData {
  return {
    settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [],
    recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [], calendarObligations: [],
  };
}
let seq = 0;
const factories: [string, () => Promise<Repository>][] = [
  ["IndexedDB", () => openRepository(`rec-day-${++seq}-${Math.random().toString(36).slice(2)}`)],
  ["demo", async () => { const r = createDemoRepository(); await r.replaceAll(emptyData()); return r; }],
];

describe.each(factories)("D-345: dayOfMonth a záloha (%s)", (_n, make) => {
  it("záloha, import a uloženie zachovajú dayOfMonth; starší záznam ostáva bez dňa", async () => {
    const repo = await make();
    await repo.replaceAll({ ...emptyData(), recurringExpenses: [rec("s-dnom", { dayOfMonth: 31 }), rec("stary")] });
    const json = JSON.parse(JSON.stringify(buildBackup(await repo.getData(), NOW)));
    const parsed = parseBackup(json, TODAY);
    expect(parsed.ok).toBe(true);
    const repo2 = await make();
    await repo2.replaceAll(parsed.data!);
    const list = (await repo2.getData()).recurringExpenses;
    expect(list.find((e) => e.id === "s-dnom")!.dayOfMonth).toBe(31);
    expect("dayOfMonth" in list.find((e) => e.id === "stary")!).toBe(false);
    // uloženie upraveného záznamu (rovnako ako formulár: nová suma, deň ostáva)
    const edited = { ...list.find((e) => e.id === "s-dnom")!, amountCents: 60000, updatedAt: NOW };
    await repo2.saveRecurringExpense(edited);
    const after = (await repo2.getData()).recurringExpenses.find((e) => e.id === "s-dnom")!;
    expect(after).toMatchObject({ dayOfMonth: 31, amountCents: 60000 });
    expect(recurringDueDate(after, "2027-02")).toBe("2027-02-28");
    expect(after.dayOfMonth).toBe(31);
  });

  it("zaplatená pravidelná povinnosť prežije zálohu aj import s prepojením a bez dvojitého stavu", async () => {
    const repo = await make();
    await repo.replaceAll({ ...emptyData(), recurringExpenses: [rec("r1", { dayOfMonth: 15 })] });
    const virt = obligationsForMonth((await repo.getData()).recurringExpenses, [], "2026-10", TODAY)[0];
    const base = { ...virt, id: "ob-1" };
    const t = buildPaymentTransaction(base, { date: "2026-10-15", amountCents: 50000, source: "z_prijmu" });
    await repo.payCalendarObligation(applyPayment(base, t, "2026-10-15"), t);
    const parsed = parseBackup(JSON.parse(JSON.stringify(buildBackup(await repo.getData(), NOW))), TODAY);
    expect(parsed.ok).toBe(true);
    const repo2 = await make();
    await repo2.replaceAll(parsed.data!);
    const d = await repo2.getData();
    expect(calendarLinkErrors(d.calendarObligations, d.transactions)).toEqual([]);
    expect(d.calendarObligations).toHaveLength(1);
    expect(d.calendarObligations[0]).toMatchObject({ id: "ob-1", status: "zaplatene", transactionId: t.id, recurringExpenseId: "r1" });
    // po importe sa výskyt nenájde druhýkrát: mesiac má jednu povinnosť, nie skutočnú aj virtuálnu
    expect(obligationsForMonth(d.recurringExpenses, d.calendarObligations, "2026-10", TODAY)).toHaveLength(1);
    await repo2.unpayCalendarObligation("ob-1");
    const back = await repo2.getData();
    expect(back.transactions).toHaveLength(0);
    expect(back.calendarObligations[0].status).toBe("caka");
  });
});
