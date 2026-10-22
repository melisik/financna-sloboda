import { describe, expect, it } from "vitest";
import { weeklySummary } from "../src/domain/weekly";
import type { Transaction } from "../src/storage/types";

// Týždenný súhrn výdavkov (N-10). Syntetické hodnoty.
const base = { createdAt: "2026-10-22T10:00:00Z", updatedAt: "2026-10-22T10:00:00Z", source: "z_hotovosti" as const };
const expense = (id: string, date: string, amountCents: number, category?: Transaction["category"]): Transaction =>
  ({ ...base, id, date, type: "vydavok", amountCents, category });

describe("týždenný súhrn výdavkov (N-10)", () => {
  const TODAY = "2026-10-22";
  it("počíta len výdavky za posledných 7 dní vrátane dneška", () => {
    const list: Transaction[] = [
      expense("a", "2026-10-16", 1000, "jedlo"), // prvý deň okna
      expense("b", "2026-10-15", 5000, "jedlo"), // mimo okna
      expense("c", "2026-10-22", 2000), // dnes, nezaradené
      { ...base, id: "d", date: "2026-10-20", type: "sporenie", amountCents: 9000 },
    ];
    const s = weeklySummary(list, TODAY, 1500);
    expect(s.fromIso).toBe("2026-10-16");
    expect(s.count).toBe(2);
    expect(s.totalCents).toBe(3000);
    expect(s.overThresholdCount).toBe(1);
    expect(s.byCategory).toEqual([
      { category: "nezaradené", cents: 2000 },
      { category: "jedlo", cents: 1000 },
    ]);
  });

  it("bez výdavkov je súhrn prázdny a nulový", () => {
    expect(weeklySummary([], TODAY, 1000)).toEqual({ fromIso: "2026-10-16", toIso: TODAY, count: 0, totalCents: 0, overThresholdCount: 0, byCategory: [] });
  });
});
