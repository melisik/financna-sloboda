import { describe, expect, it } from "vitest";
import { monthSummary, NECESSITY } from "../src/domain/monthSummary";
import type { Budget, RecurringExpense, Transaction } from "../src/storage/types";

// Mesačný prehľad výdavkov: plnenie plánu a rozpis podľa nevyhnutnosti (D-131). Syntetické hodnoty.
const TODAY = "2026-10-21";
const meta = { createdAt: "x", updatedAt: "x", source: "z_hotovosti" as const };
const exp = (id: string, category: Transaction["category"], amountCents: number, date = "2026-10-03"): Transaction =>
  ({ ...meta, id, type: "vydavok", date, category, amountCents });

describe("mesačný prehľad výdavkov", () => {
  it("plnenie počíta len kategórie s limitom; nezaradené sú mimo plánu", () => {
    const budgets: Budget[] = [
      { id: "jedlo", category: "jedlo", limitCents: 10000, updatedAt: "x" },
      { id: "zábava", category: "zábava", limitCents: 5000, updatedAt: "x" },
    ];
    const txs = [exp("a", "jedlo", 4000), exp("b", "zábava", 3000), exp("c", undefined, 1000), exp("d", "doprava", 2000)];
    const s = monthSummary(txs, budgets, [], TODAY, 100000);
    expect(s.planCents).toBe(15000);
    expect(s.plannedSpentCents).toBe(7000);
    expect(s.percent).toBe(47);
    expect(s.unassignedCents).toBe(1000);
    expect(s.byNecessity).toEqual({ nevyhnutne: 6000, nie_nevyhnutne: 3000, ostatne: 0 });
  });

  it("bez plánu je percento null; výdavky z iného mesiaca sa nerátajú", () => {
    const s = monthSummary([exp("a", "jedlo", 4000, "2026-09-30")], [], [], TODAY, 100000);
    expect(s.percent).toBeNull();
    expect(s.byNecessity.nevyhnutne).toBe(0);
  });

  it("pravidelné výdavky sa rátajú do kategórie a do nevyhnutnosti", () => {
    const rec: RecurringExpense = { id: "r", name: "Streaming", category: "predplatné a služby", frequency: "mesacne", amountCents: 1200, startDate: "2026-01-01", createdAt: "x", updatedAt: "x" };
    const s = monthSummary([], [], [rec], TODAY, 100000);
    expect(s.byNecessity.nie_nevyhnutne).toBe(1200);
  });

  it("počíta výdavky nad prahom tohto mesiaca", () => {
    const txs = [exp("a", "jedlo", 60000), exp("b", "jedlo", 500), exp("c", "jedlo", 60000, "2026-09-02")];
    expect(monthSummary(txs, [], [], TODAY, 10000).overThresholdCount).toBe(1);
  });

  it("každá kategória má zatriedenie", () => {
    expect(Object.keys(NECESSITY)).toHaveLength(12);
  });
});
