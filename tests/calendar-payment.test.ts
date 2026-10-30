import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import {
  CalendarLinkError,
  findNewlyOverdue,
  applyPayment,
  buildPaymentTransaction,
  calendarLinkErrors,
  newObligation,
  similarUnpaidObligations,
} from "../src/domain/calendarObligation";
import { buildBackup, parseBackup } from "../src/storage/backup";
import { createDemoRepository } from "../src/storage/demoRepository";
import { openRepository } from "../src/storage/indexeddb";
import type { Repository } from "../src/storage/repository";
import type { AppData, CalendarObligation, Transaction } from "../src/storage/types";

const TODAY = "2026-10-30";
const PAID = "2026-10-30";
let seq = 0;
const freshName = () => `cal-pay-${++seq}-${Math.random().toString(36).slice(2)}`;

const obligation = (over: Partial<CalendarObligation> = {}): CalendarObligation => ({
  ...newObligation({ name: "TEST D342 – Servis automobilu", category: "bývanie", amountCents: 12500, dueDate: "2026-11-15" }),
  ...over,
});
const payment = (o: CalendarObligation, over: Partial<{ date: string; amountCents: number }> = {}) => {
  const t = buildPaymentTransaction(o, { date: over.date ?? PAID, amountCents: over.amountCents ?? o.amountCents, source: "z_prijmu" });
  return { t, paid: applyPayment(o, t, over.date ?? PAID) };
};
const manualTx = (id: string, amountCents = 12500, date = PAID): Transaction => ({
  id, date, type: "vydavok", amountCents, source: "z_prijmu", createdAt: "2026-10-30T10:00:00Z", updatedAt: "2026-10-30T10:00:00Z",
});

const factories: [string, () => Promise<Repository>][] = [
  ["IndexedDB", () => openRepository(freshName())],
  ["demo", async () => { const r = createDemoRepository(); await r.replaceAll(emptyData()); return r; }],
];

describe("D-345: predvyplnenie transakcie z povinnosti", () => {
  it("suma, dátum, kategória, poznámka a väzba na povinnosť", () => {
    const o = obligation({ id: "ob-1" });
    const t = buildPaymentTransaction(o, { date: "2026-10-29", amountCents: 12000, source: "z_hotovosti" });
    expect(t).toMatchObject({ type: "vydavok", date: "2026-10-29", amountCents: 12000, source: "z_hotovosti", category: "bývanie", note: o.name, calendarObligationId: "ob-1" });
    expect(applyPayment(o, t, "2026-10-29")).toMatchObject({ status: "zaplatene", paidDate: "2026-10-29", transactionId: t.id });
  });
});

describe.each(factories)("D-345: zaplatenie a zrušenie zaplatenia (%s)", (_name, make) => {
  async function seeded() {
    const repo = await make();
    const o = obligation({ id: "ob-1" });
    await repo.saveCalendarObligation(o);
    return { repo, o };
  }

  it("zaplatenie vytvorí presne jednu transakciu a uloží odkazy na oboch stranách", async () => {
    const { repo, o } = await seeded();
    const { t, paid } = payment(o);
    expect(await repo.payCalendarObligation(paid, t)).toEqual({ created: true });
    const d = await repo.getData();
    expect(d.transactions).toHaveLength(1);
    expect(d.transactions[0]).toMatchObject({ id: t.id, calendarObligationId: "ob-1", amountCents: 12500 });
    expect(d.calendarObligations[0]).toMatchObject({ id: "ob-1", status: "zaplatene", transactionId: t.id, paidDate: PAID });
    expect(calendarLinkErrors(d.calendarObligations, d.transactions)).toEqual([]);
  });

  it("opakované zaplatenie nevytvorí druhú transakciu", async () => {
    const { repo, o } = await seeded();
    const first = payment(o);
    await repo.payCalendarObligation(first.paid, first.t);
    const second = payment(o);
    expect(await repo.payCalendarObligation(second.paid, second.t)).toEqual({ created: false });
    const d = await repo.getData();
    expect(d.transactions.map((x) => x.id)).toEqual([first.t.id]);
    expect(d.calendarObligations[0].transactionId).toBe(first.t.id);
  });

  it("súbežné požiadavky: vznikne jediná transakcia", async () => {
    const { repo, o } = await seeded();
    const results = await Promise.all([1, 2, 3, 4].map(() => { const p = payment(o); return repo.payCalendarObligation(p.paid, p.t); }));
    expect(results.filter((r) => r.created)).toHaveLength(1);
    const d = await repo.getData();
    expect(d.transactions).toHaveLength(1);
    expect(calendarLinkErrors(d.calendarObligations, d.transactions)).toEqual([]);
  });

  it("virtuálny výskyt pravidelného výdavku: dve zaplatenia dajú jednu povinnosť a jednu transakciu", async () => {
    const repo = await make();
    const virtual = (id: string): CalendarObligation => obligation({ id, recurringExpenseId: "re-1", occurrenceMonth: "2026-11" });
    const a = payment(virtual("persist-a"));
    const b = payment(virtual("persist-b"));
    const results = await Promise.all([repo.payCalendarObligation(a.paid, a.t), repo.payCalendarObligation(b.paid, b.t)]);
    expect(results.filter((r) => r.created)).toHaveLength(1);
    const d = await repo.getData();
    expect(d.calendarObligations).toHaveLength(1);
    expect(d.transactions).toHaveLength(1);
    expect(d.transactions[0].calendarObligationId).toBe(d.calendarObligations[0].id);
    expect(calendarLinkErrors(d.calendarObligations, d.transactions)).toEqual([]);
  });

  it("zrušenie zaplatenia zmaže len prepojenú transakciu a vráti povinnosť do čakania", async () => {
    const { repo, o } = await seeded();
    const { t, paid } = payment(o);
    await repo.payCalendarObligation(paid, t);
    await repo.addTransaction(manualTx("manual-same", 12500, PAID)); // rovnaká suma aj dátum, ale nepatrí povinnosti
    await repo.unpayCalendarObligation("ob-1");
    const d = await repo.getData();
    expect(d.transactions.map((x) => x.id)).toEqual(["manual-same"]);
    expect(d.calendarObligations[0].status).toBe("caka");
    expect(d.calendarObligations[0].transactionId).toBeUndefined();
    expect(d.calendarObligations[0].paidDate).toBeUndefined();
  });

  it("zrušenie zaplatenia opakovane alebo pri nezaplatenej povinnosti nič nemení", async () => {
    const { repo, o } = await seeded();
    const before = await repo.getData();
    await repo.unpayCalendarObligation(o.id);
    expect(await repo.getData()).toEqual(before);
    const { t, paid } = payment(o);
    await repo.payCalendarObligation(paid, t);
    await repo.unpayCalendarObligation(o.id);
    await repo.unpayCalendarObligation(o.id);
    expect((await repo.getData()).transactions).toHaveLength(0);
  });

  it("neexistujúca povinnosť: chyba a žiadna zmena", async () => {
    const { repo } = await seeded();
    const before = await repo.getData();
    await expect(repo.unpayCalendarObligation("neexistuje")).rejects.toBeInstanceOf(CalendarLinkError);
    expect(await repo.getData()).toEqual(before);
  });

  it("chýbajúca alebo nesprávne prepojená transakcia: chyba a pôvodný stav ostane", async () => {
    for (const broken of ["missing", "wrong-back-reference"] as const) {
      const repo = await make();
      const o = obligation({ id: "ob-1", status: "zaplatene", paidDate: PAID, transactionId: "tx-1" });
      const other = manualTx("tx-2");
      const linked = broken === "missing" ? [other] : [{ ...manualTx("tx-1"), calendarObligationId: "ob-other" }, other];
      await repo.replaceAll({ ...emptyData(), transactions: linked, calendarObligations: [o] });
      const before = await repo.getData();
      await expect(repo.unpayCalendarObligation("ob-1")).rejects.toBeInstanceOf(CalendarLinkError);
      expect(await repo.getData()).toEqual(before);
    }
  });

  it("stará zaplatená povinnosť bez transakcie sa vráti do čakania a nič sa nemaže", async () => {
    const repo = await make();
    await repo.replaceAll({ ...emptyData(), transactions: [manualTx("tx-9")], calendarObligations: [obligation({ id: "ob-1", status: "zaplatene", paidDate: PAID })] });
    await repo.unpayCalendarObligation("ob-1");
    const d = await repo.getData();
    expect(d.transactions.map((x) => x.id)).toEqual(["tx-9"]);
    expect(d.calendarObligations[0].status).toBe("caka");
  });

  it("zmazanie prepojenej transakcie v histórii vráti povinnosť do čakania; vrátenie zmazania ju znovu prepojí", async () => {
    const { repo, o } = await seeded();
    const { t, paid } = payment(o);
    await repo.payCalendarObligation(paid, t);
    const stored = (await repo.getData()).transactions[0];
    await repo.deleteTransaction(t.id);
    let d = await repo.getData();
    expect(d.transactions).toHaveLength(0);
    expect(d.calendarObligations[0]).toMatchObject({ status: "caka" });
    expect(d.calendarObligations[0].transactionId).toBeUndefined();
    await repo.addTransaction(stored);
    d = await repo.getData();
    expect(d.calendarObligations[0]).toMatchObject({ status: "zaplatene", transactionId: t.id });
    expect(calendarLinkErrors(d.calendarObligations, d.transactions)).toEqual([]);
  });

  it("transakcia s odkazom na neexistujúcu povinnosť sa uloží bez odkazu", async () => {
    const repo = await make();
    await repo.addTransaction({ ...manualTx("tx-1"), calendarObligationId: "nikde" });
    expect((await repo.getData()).transactions[0].calendarObligationId).toBeUndefined();
  });
});

describe("D-345: upozornenie pri ručnej transakcii", () => {
  const list = [
    obligation({ id: "a" }),
    obligation({ id: "b", amountCents: 999 }),
    obligation({ id: "c", dueDate: "2026-11-16" }),
    obligation({ id: "d", status: "zaplatene" }),
    obligation({ id: "virtual:r:2026-11" }),
  ];
  it("nájde len nezaplatenú povinnosť s rovnakou sumou a dňom", () => {
    expect(similarUnpaidObligations(list, 12500, "2026-11-15").map((o) => o.id)).toEqual(["a"]);
    expect(similarUnpaidObligations(list, 12500, "2026-11-14")).toEqual([]);
  });
  it("nič nemení a nič neprepája: je to čistý výpočet", () => {
    const copy = JSON.parse(JSON.stringify(list));
    similarUnpaidObligations(list, 12500, "2026-11-15");
    expect(list).toEqual(copy);
  });
});

describe("D-345: záloha a obnova zachová vzťahy", () => {
  it("export, validácia, import: povinnosť aj transakcia ostanú prepojené bez duplicít", async () => {
    const repo = await openRepository(freshName());
    const o = obligation({ id: "ob-1" });
    await repo.saveCalendarObligation(o);
    const { t, paid } = payment(o);
    await repo.payCalendarObligation(paid, t);
    const json = JSON.parse(JSON.stringify(buildBackup(await repo.getData(), "2026-10-30T10:00:00Z")));
    const parsed = parseBackup(json, TODAY);
    expect(parsed.ok).toBe(true);
    const target = await openRepository(freshName());
    await target.replaceAll(parsed.data!);
    await target.replaceAll(parsed.data!); // opakovaný import
    const d = await target.getData();
    expect(d.transactions).toHaveLength(1);
    expect(d.calendarObligations).toHaveLength(1);
    expect(d.calendarObligations[0].transactionId).toBe(d.transactions[0].id);
    expect(d.transactions[0].calendarObligationId).toBe("ob-1");
  });

  it("záloha s porušeným prepojením sa odmietne a nič sa neimportuje", async () => {
    const repo = await openRepository(freshName());
    const o = obligation({ id: "ob-1" });
    await repo.saveCalendarObligation(o);
    const { t, paid } = payment(o);
    await repo.payCalendarObligation(paid, t);
    const good = JSON.parse(JSON.stringify(buildBackup(await repo.getData(), "2026-10-30T10:00:00Z")));
    const noTx = { ...good, transactions: [] };
    expect(parseBackup(noTx, TODAY)).toMatchObject({ ok: false });
    const noBack = { ...good, transactions: good.transactions.map((x: Transaction) => ({ ...x, calendarObligationId: undefined })) };
    expect(parseBackup(noBack, TODAY)).toMatchObject({ ok: false });
    const dangling = { ...good, calendarObligations: [] };
    expect(parseBackup(dangling, TODAY)).toMatchObject({ ok: false });
  });
});

function emptyData(): AppData {
  return {
    settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [],
    recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [], calendarObligations: [],
  };
}

describe.each(factories)("D-345: kontrola omeškania nesmie prepísať novší stav (%s)", (_name, make) => {
  const overdueOb = () => obligation({ id: "ob-1", dueDate: "2026-10-01" });

  it("starý výsledok kontroly po zaplatení povinnosť nevráti do „po splatnosti“ a prepojenie ostane", async () => {
    const repo = await make();
    const o = overdueOb();
    await repo.saveCalendarObligation(o);
    // 1. kontrola omeškania načíta povinnosť a zistí, čo treba označiť
    const stale = findNewlyOverdue((await repo.getData()).calendarObligations, TODAY);
    expect(stale.map((x) => x.id)).toEqual(["ob-1"]);
    // 2. medzitým ju používateľ zaplatí
    const { t, paid } = payment(o);
    await repo.payCalendarObligation(paid, t);
    // 3. kontrola sa pokúsi zapísať starý výsledok
    expect(await repo.markCalendarObligationsOverdue(stale.map((x) => x.id), TODAY)).toBe(0);
    const d = await repo.getData();
    expect(d.calendarObligations[0]).toMatchObject({ status: "zaplatene", transactionId: t.id, paidDate: PAID });
    expect(d.transactions.map((x) => x.id)).toEqual([t.id]);
    expect(calendarLinkErrors(d.calendarObligations, d.transactions)).toEqual([]);
  });

  it("súbežná kontrola omeškania a zaplatenie: povinnosť nikdy nekončí ako zaplatená bez transakcie ani ako po splatnosti s transakciou", async () => {
    const repo = await make();
    const o = overdueOb();
    await repo.saveCalendarObligation(o);
    const { t, paid } = payment(o);
    await Promise.all([repo.markCalendarObligationsOverdue(["ob-1"], TODAY), repo.payCalendarObligation(paid, t)]);
    const d = await repo.getData();
    expect(d.transactions).toHaveLength(1);
    expect(d.calendarObligations[0]).toMatchObject({ status: "zaplatene", transactionId: t.id });
  });

  it("označí len nezaplatené po termíne; nič iné nemení", async () => {
    const repo = await make();
    await repo.saveCalendarObligation(overdueOb());
    await repo.saveCalendarObligation(obligation({ id: "ob-future", dueDate: "2026-12-01" }));
    await repo.saveCalendarObligation(obligation({ id: "ob-paid", dueDate: "2026-10-01", status: "zaplatene", paidDate: PAID }));
    expect(await repo.markCalendarObligationsOverdue(["ob-1", "ob-future", "ob-paid", "neexistuje"], TODAY)).toBe(1);
    const byId = Object.fromEntries((await repo.getData()).calendarObligations.map((x) => [x.id, x.status]));
    expect(byId).toEqual({ "ob-1": "po_splatnosti", "ob-future": "caka", "ob-paid": "zaplatene" });
    expect(await repo.markCalendarObligationsOverdue(["ob-1"], TODAY)).toBe(0);
  });
});
