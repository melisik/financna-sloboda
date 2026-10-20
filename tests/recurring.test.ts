import { describe, expect, it } from "vitest";
import { monthlyRecurringByCategory, monthlyRecurringTotalCents, monthlyShareCents } from "../src/domain/recurring";
import type { RecurringExpense } from "../src/storage/types";

// Pravidelné výdavky (D-124). Syntetické hodnoty v centoch.
const base = { createdAt: "2026-10-20T10:00:00.000Z", updatedAt: "2026-10-20T10:00:00.000Z" };
const subs: RecurringExpense = { ...base, id: "a", name: "predplatné", category: "predplatné a služby", frequency: "mesacne", amountCents: 1200, startDate: "2026-01-01" };
const insurance: RecurringExpense = { ...base, id: "b", name: "poistka", category: "iné", frequency: "rocne", amountCents: 120_000, startDate: "2026-01-01" };
const ended: RecurringExpense = { ...base, id: "c", name: "skončené", category: "zábava", frequency: "mesacne", amountCents: 5000, startDate: "2025-01-01", endDate: "2026-06-30" };
const future: RecurringExpense = { ...base, id: "d", name: "budúce", category: "zábava", frequency: "mesacne", amountCents: 7000, startDate: "2027-01-01" };

describe("pravidelné výdavky (D-124)", () => {
  it("ročná suma sa delí dvanástimi", () => {
    expect(monthlyShareCents(insurance)).toBe(10_000);
    expect(monthlyShareCents(subs)).toBe(1200);
  });

  it("mesačný súčet berie len platné položky", () => {
    expect(monthlyRecurringTotalCents([subs, insurance, ended, future], "2026-10-20")).toBe(1200 + 10_000);
  });

  it("súčet podľa kategórie", () => {
    expect(monthlyRecurringByCategory([subs, insurance, ended, future], "2026-10-20")).toEqual({
      "predplatné a služby": 1200,
      iné: 10_000,
    });
  });
});

import { buildBackup, parseBackup } from "../src/storage/backup";

describe("pravidelné výdavky v zálohe (D-124)", () => {
  it("export a import zachová položky a verzia 2 zálohy dostane prázdny zoznam", () => {
    const data: any = { settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [subs, insurance], stockItems: [] };
    const back: any = parseBackup(JSON.parse(JSON.stringify(buildBackup(data, "2026-10-20T10:00:00.000Z"))), "2026-10-20");
    expect(back.ok).toBe(true);
    expect(back.data.recurringExpenses).toEqual([subs, insurance]);

    const v2: any = parseBackup({ app: "financna-sloboda", schemaVersion: 2, exportedAt: "x", settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [] }, "2026-10-20");
    expect(v2.ok).toBe(true);
    expect(v2.data.recurringExpenses).toEqual([]);
  });
});
