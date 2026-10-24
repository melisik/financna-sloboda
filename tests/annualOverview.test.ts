import { describe, expect, it } from "vitest";
import { annualOverview, type OverviewSettings } from "../src/domain/annualOverview";
import type { Snapshot } from "../src/storage/types";

// Ročný prehľad (docs/13, oddiel 4). Syntetické hodnoty v centoch.
const settings: OverviewSettings = { target: 60_000_000, realReturn: 0.035, mInv: 0, mCash: 0 };

function snap(date: string, invCents: number, cashCents = 0, auto = false): Snapshot {
  return { id: date, date, investmentsCents: invCents, cashCents, createdAt: `${date}T00:00:00Z`, auto };
}

describe("Ročný prehľad", () => {
  it("bez vyhodnotení je prehľad prázdny", () => {
    expect(annualOverview([], settings)).toEqual([]);
  });

  it("riadky sú od najstaršieho, zmena K a dátumu cieľa sa počíta oproti predchádzajúcemu", () => {
    const rows = annualOverview([snap("2026-07-01", 40_000_000), snap("2026-01-01", 30_000_000)], settings);
    expect(rows.map((r) => r.date)).toEqual(["2026-01-01", "2026-07-01"]);
    expect(rows[0].deltaTotalCents).toBeNull();
    expect(rows[0].deltaGoalMonths).toBeNull();
    expect(rows[1].deltaTotalCents).toBe(10_000_000);
    // Vyšší K skracuje cestu k cieľu, dátum sa posúva skôr (záporná zmena).
    expect(rows[1].deltaGoalMonths).toBeLessThan(0);
  });

  // Investícia z príjmu zvyšuje K, rezerva ho mení (nie je to výnos ani trhová zmena).
  it("riadok rozpíše investíciu z príjmu do sporenia a rezervu osobitne, zvyšok je výnos", () => {
    const tx = (id: string, date: string, extra: object) => ({ id, date, amountCents: 5_000, createdAt: `${date}T10:00:00Z`, updatedAt: `${date}T10:00:00Z`, ...extra });
    const transactions = [
      tx("i1", "2026-02-01", { type: "investicia", source: "z_prijmu" }),
      tx("r1", "2026-03-01", { type: "rezerva" }),
    ] as never[];
    const rows = annualOverview(
      [snap("2026-01-01", 0, 10_000_000), snap("2026-07-01", 5_000, 9_995_000)],
      settings,
      transactions,
    );
    expect(rows[1].sporenieCents).toBe(5_000);
    expect(rows[1].rezervaCents).toBe(-5_000);
    expect(rows[1].ostatneCents).toBe(0);
  });

  it("K je súčet investícií a hotovosti; dátum cieľa je v rámci 50 rokov", () => {
    const [row] = annualOverview([snap("2026-01-01", 30_000_000, 5_000_000)], settings);
    expect(row.totalCents).toBe(35_000_000);
    expect(row.goal?.kind).toBe("date");
  });

  it("bez kapitálu, ktorý rastie, je cieľ nedosiahnuteľný", () => {
    const [row] = annualOverview([snap("2026-01-01", 0, 0)], settings);
    expect(row.goal).toEqual({ kind: "unreachable" });
    expect(row.deltaGoalMonths).toBeNull();
  });

  it("bez Nastavení sa zobrazí len K", () => {
    const rows = annualOverview([snap("2026-01-01", 30_000_000), snap("2026-07-01", 40_000_000)], null);
    expect(rows.every((r) => r.goal === null)).toBe(true);
    expect(rows.every((r) => r.deltaGoalMonths === null)).toBe(true);
    expect(rows[1].deltaTotalCents).toBe(10_000_000);
  });

  it("auto-vyhodnotenie je označené", () => {
    const [row] = annualOverview([snap("2026-01-01", 30_000_000, 0, true)], settings);
    expect(row.auto).toBe(true);
  });
});
