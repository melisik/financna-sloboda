import { describe, expect, it } from "vitest";
import {
  toMonth,
  findOccurrence,
  generateFromRecurring,
  oneTimeForMonth,
  findNewlyOverdue,
  resolveStatuses,
  monthlyExpectedTotalCents,
  monthlyTotalCents,
  newObligation,
  obligationsForMonth,
} from "../src/domain/calendarObligation";
import type { CalendarObligation, RecurringExpense } from "../src/storage/types";

const TS = "2026-10-01T10:00:00Z";
const TODAY = "2026-10-30";
const MONTH = "2026-10";

function makeRecurring(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: "re1",
    name: "Predplatné",
    category: "iné",
    amountCents: 1000,
    frequency: "mesacne",
    startDate: "2026-01-01",
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

function makeObligation(overrides: Partial<CalendarObligation> = {}): CalendarObligation {
  return {
    id: "ob1",
    name: "Povinnosť",
    category: "iné",
    amountCents: 2000,
    dueDate: `${MONTH}-15`,
    status: "caka",
    createdAt: TS,
    updatedAt: TS,
    ...overrides,
  };
}

describe("toMonth", () => {
  it("extracts YYYY-MM from YYYY-MM-DD", () => {
    expect(toMonth("2026-10-30")).toBe("2026-10");
    expect(toMonth("2026-01-01")).toBe("2026-01");
  });
});

describe("findOccurrence", () => {
  it("finds existing obligation for recurringExpenseId + occurrenceMonth", () => {
    const ob = makeObligation({ recurringExpenseId: "re1", occurrenceMonth: MONTH });
    expect(findOccurrence([ob], "re1", MONTH)).toBe(ob);
  });
  it("returns null when not found", () => {
    expect(findOccurrence([], "re1", MONTH)).toBeNull();
  });
});

describe("generateFromRecurring", () => {
  it("generates virtual obligation for active monthly recurring", () => {
    const re = makeRecurring();
    const result = generateFromRecurring([re], MONTH, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(`virtual:re1:${MONTH}`);
    expect(result[0].name).toBe("Predplatné");
    expect(result[0].status).toBe("caka");
    expect(result[0].dueDate).toBe("2026-10-31"); // lastDayOfMonth
  });

  it("uses dayOfMonth if set", () => {
    const re = makeRecurring({ dayOfMonth: 15 });
    const result = generateFromRecurring([re], MONTH, []);
    expect(result[0].dueDate).toBe("2026-10-15");
  });

  it("uses last day of month when dayOfMonth exceeds month length", () => {
    const re = makeRecurring({ dayOfMonth: 31, startDate: "2026-02-01" });
    const result = generateFromRecurring([re], "2026-02", []);
    expect(result[0].dueDate).toBe("2026-02-28");
  });

  it("returns existing persisted obligation if found", () => {
    const re = makeRecurring();
    const existing = makeObligation({ id: "real-ob1", recurringExpenseId: "re1", occurrenceMonth: MONTH, status: "zaplatene" });
    const result = generateFromRecurring([re], MONTH, [existing]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("real-ob1");
    expect(result[0].status).toBe("zaplatene");
  });

  it("skips inactive recurring (startDate after month)", () => {
    const re = makeRecurring({ startDate: "2027-01-01" });
    expect(generateFromRecurring([re], MONTH, [])).toHaveLength(0);
  });

  it("skips annual recurring if month doesn't match startDate month", () => {
    const re = makeRecurring({ frequency: "rocne", startDate: "2026-03-15" });
    // October != March
    expect(generateFromRecurring([re], MONTH, [])).toHaveLength(0);
  });

  it("includes annual recurring only in matching month", () => {
    const re = makeRecurring({ frequency: "rocne", startDate: "2026-10-15" });
    expect(generateFromRecurring([re], MONTH, [])).toHaveLength(1);
    expect(generateFromRecurring([re], "2026-11", [])).toHaveLength(0);
  });
});

describe("oneTimeForMonth", () => {
  it("returns only non-recurring obligations in the month", () => {
    const oneTime = makeObligation({ id: "ot1", dueDate: `${MONTH}-10` });
    const recurring = makeObligation({ id: "ot2", dueDate: `${MONTH}-10`, recurringExpenseId: "re1" });
    const other = makeObligation({ id: "ot3", dueDate: "2026-09-10" });
    expect(oneTimeForMonth([oneTime, recurring, other], MONTH)).toEqual([oneTime]);
  });
});

describe("findNewlyOverdue", () => {
  it("returns non-virtual caka obligations past dueDate", () => {
    const overdue = makeObligation({ id: "ob-real", dueDate: "2026-10-01", status: "caka" });
    const virtual = makeObligation({ id: "virtual:re1:2026-10", dueDate: "2026-10-01", status: "caka" });
    const paid = makeObligation({ id: "ob-paid", dueDate: "2026-10-01", status: "zaplatene" });
    const future = makeObligation({ id: "ob-future", dueDate: "2026-12-31", status: "caka" });
    const result = findNewlyOverdue([overdue, virtual, paid, future], TODAY);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("ob-real");
  });
});

describe("resolveStatuses", () => {
  it("marks overdue items as po_splatnosti without persisting", () => {
    const ob = makeObligation({ dueDate: "2026-10-01", status: "caka" });
    const result = resolveStatuses([ob], TODAY);
    expect(result[0].status).toBe("po_splatnosti");
  });

  it("does not change paid items", () => {
    const ob = makeObligation({ dueDate: "2026-10-01", status: "zaplatene" });
    expect(resolveStatuses([ob], TODAY)[0].status).toBe("zaplatene");
  });

  it("applies to virtual obligations too (display only)", () => {
    const ob = makeObligation({ id: "virtual:re1:2026-10", dueDate: "2026-10-01", status: "caka" });
    expect(resolveStatuses([ob], TODAY)[0].status).toBe("po_splatnosti");
  });
});

describe("monthlyExpectedTotalCents / monthlyTotalCents", () => {
  it("sums unpaid obligations for expected, all for total", () => {
    const paid = makeObligation({ id: "ob-paid", dueDate: `${MONTH}-10`, amountCents: 500, status: "zaplatene" });
    const waiting = makeObligation({ id: "ob-caka", dueDate: `${MONTH}-15`, amountCents: 1000, status: "caka" });
    const overdue = makeObligation({ id: "ob-overdue", dueDate: `${MONTH}-01`, amountCents: 200, status: "po_splatnosti" });
    expect(monthlyExpectedTotalCents([paid, waiting, overdue], MONTH)).toBe(1200);
    expect(monthlyTotalCents([paid, waiting, overdue], MONTH)).toBe(1700);
  });
});

describe("newObligation", () => {
  it("creates a one-time obligation with caka status", () => {
    const ob = newObligation({ name: "Test", category: "iné", amountCents: 3000, dueDate: "2026-11-01" });
    expect(ob.status).toBe("caka");
    expect(ob.recurringExpenseId).toBeUndefined();
    expect(ob.name).toBe("Test");
    expect(ob.amountCents).toBe(3000);
  });
});

describe("obligationsForMonth", () => {
  it("combines recurring and one-time, sorted by dueDate", () => {
    const re = makeRecurring({ dayOfMonth: 20 });
    const oneTime = makeObligation({ id: "ot1", dueDate: `${MONTH}-05` });
    const result = obligationsForMonth([re], [oneTime], MONTH, TODAY);
    expect(result).toHaveLength(2);
    expect(result[0].dueDate).toBe(`${MONTH}-05`);
    expect(result[1].dueDate).toBe(`${MONTH}-20`);
  });
});
