import { describe, expect, it } from "vitest";
import { categoryComparison } from "../src/domain/annualOverview";
import type { Transaction } from "../src/storage/types";

// N-11 (docs/08): porovnanie výdavkov v kategóriách s predchádzajúcim rokom. Syntetické hodnoty.
const meta = { createdAt: "x", updatedAt: "x" };
const tx = (id: string, date: string, type: Transaction["type"], amountCents: number, category?: string): Transaction =>
  ({ ...meta, id, date, type, amountCents, ...(category ? { category } : {}) }) as Transaction;

describe("porovnanie výdavkov v kategóriách (N-11)", () => {
  const txs = [
    tx("a", "2025-03-10", "vydavok", 10_000, "jedlo"),
    tx("b", "2025-04-10", "vydavok", 5_000, "doprava"),
    tx("c", "2026-03-10", "vydavok", 8_000, "jedlo"),
    tx("d", "2026-05-10", "vydavok", 3_000, "zábava"),
  ];

  it("celé roky: zmena každej kategórie, zoradené podľa výdavkov v novšom roku", () => {
    expect(categoryComparison(txs, 2026, 2025, 12)).toEqual([
      { category: "jedlo", prevCents: 10_000, curCents: 8_000, diffCents: -2_000 },
      { category: "zábava", prevCents: 0, curCents: 3_000, diffCents: 3_000 },
      { category: "doprava", prevCents: 5_000, curCents: 0, diffCents: -5_000 },
    ]);
  });

  it("obdobie do mesiaca: mesiace po ňom sa nerátajú ani v jednom roku; kategória bez výdavkov v období sa nezobrazí", () => {
    expect(categoryComparison(txs, 2026, 2025, 4)).toEqual([
      { category: "jedlo", prevCents: 10_000, curCents: 8_000, diffCents: -2_000 },
      { category: "doprava", prevCents: 5_000, curCents: 0, diffCents: -5_000 },
    ]);
  });

  it("počítajú sa len výdavky, sporenie nie; bez kategórie je nezaradené", () => {
    const mixed = [tx("s", "2026-01-05", "sporenie", 9_000), tx("n", "2026-01-06", "vydavok", 700)];
    expect(categoryComparison(mixed, 2026, 2025, 12)).toEqual([
      { category: "nezaradené", prevCents: 0, curCents: 700, diffCents: 700 },
    ]);
  });

  it("bez výdavkov v oboch rokoch je porovnanie prázdne", () => {
    expect(categoryComparison([], 2026, 2025, 12)).toEqual([]);
  });
});
