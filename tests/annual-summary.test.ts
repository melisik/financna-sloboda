import { describe, expect, it } from "vitest";
import { annualOverview, flowsBetween, yearlySummary } from "../src/domain/annualOverview";
import type { Snapshot, Transaction } from "../src/storage/types";
import type { Rental } from "../src/domain/rentalGoal";

// Rozpis zmeny K a ročné súhrny (Ročný prehľad). Syntetické hodnoty.
const meta = { createdAt: "x", updatedAt: "x" };
const snap = (id: string, date: string, inv: number, cash: number): Snapshot => ({ id, date, investmentsCents: inv, cashCents: cash, createdAt: "x" });
const tx = (id: string, date: string, type: Transaction["type"], amountCents: number, extra: Partial<Transaction> = {}): Transaction =>
  ({ ...meta, id, date, type, amountCents, ...extra }) as Transaction;

describe("tok peňazí medzi vyhodnoteniami", () => {
  it("hranice obdobia: od sa nerátа, do sa rátа; výdavky z príjmu nemenia K", () => {
    const txs = [
      tx("a", "2026-01-01", "sporenie", 100),
      tx("b", "2026-01-02", "sporenie", 10),
      tx("c", "2026-02-01", "sporenie", 20),
      tx("d", "2026-01-10", "vydavok", 5, { source: "z_hotovosti", category: "jedlo" }),
      tx("e", "2026-01-11", "vydavok", 7, { source: "z_prijmu", category: "jedlo" }),
    ];
    expect(flowsBetween(txs, snap("p", "2026-01-01", 0, 0), "2026-02-01")).toEqual({ sporenie: 30, vydavky: 5 });
  });

  it("výdavok z dňa vyhodnotenia zapísaný po ňom sa rátа do ďalšieho obdobia; pred ním nie (nález 7, D-169)", () => {
    const prev: Snapshot = { id: "p", date: "2026-10-05", investmentsCents: 0, cashCents: 0, createdAt: "2026-10-05T08:00:00.000Z" };
    const before = tx("b", "2026-10-05", "vydavok", 3, { source: "z_hotovosti", category: "jedlo", createdAt: "2026-10-05T07:00:00.000Z" });
    const after = tx("a", "2026-10-05", "vydavok", 10, { source: "z_hotovosti", category: "jedlo", createdAt: "2026-10-05T20:00:00.000Z" });
    expect(flowsBetween([before, after], prev, "2026-10-20")).toEqual({ sporenie: 0, vydavky: 10 });
  });

  it("Ročný prehľad počíta dátum cieľa s nehnuteľnosťami v prenájme rovnako ako hlavný cieľ (nález 6, D-169)", () => {
    const settings = { target: 60_000_000, realReturn: 0.035, mInv: 50_000, mCash: 0 };
    const rental: Rental = { valueCents: 20_000_000, mortgageBalanceCents: 0, mortgageRate: 0, paymentCents: 0, netRentCents: 100_000 };
    const s = [snap("a", "2026-10-01", 1_000_000, 0)];
    const without = annualOverview(s, settings, [], []);
    const withRental = annualOverview(s, settings, [], [rental]);
    expect(withRental[0].goal).not.toEqual(without[0].goal);
  });

  it("riadok rozpíše zmenu K na sporenie, výdavky a zvyšok", () => {
    const snaps = [snap("a", "2026-01-01", 100, 0), snap("b", "2026-02-01", 100, 50)];
    const txs = [tx("s", "2026-01-15", "sporenie", 50), tx("v", "2026-01-20", "vydavok", 20, { source: "z_hotovosti", category: "jedlo" })];
    const rows = annualOverview(snaps, null, txs);
    expect(rows[0].sporenieCents).toBeNull();
    expect(rows[1]).toMatchObject({ deltaTotalCents: 50, sporenieCents: 50, vydavkyCents: 20, ostatneCents: 20 });
  });
});

describe("ročné súhrny", () => {
  it("K na konci roka, zmena za rok, sporenie, výdavky a najväčšia kategória", () => {
    const snaps = [snap("a", "2025-12-31", 100, 0), snap("b", "2026-03-01", 150, 0)];
    const txs = [
      tx("s", "2026-02-01", "sporenie", 10),
      tx("v1", "2026-02-02", "vydavok", 5, { source: "z_hotovosti", category: "jedlo" }),
      tx("v2", "2026-02-03", "vydavok", 9, { source: "z_prijmu", category: "doprava" }),
    ];
    const years = yearlySummary(snaps, txs);
    expect(years.map((y) => y.year)).toEqual([2025, 2026]);
    expect(years[0]).toMatchObject({ endK: 100, deltaK: null, sporenieCents: 0 });
    expect(years[1]).toMatchObject({ endK: 150, deltaK: 50, sporenieCents: 10, vydavkyCents: 14, topCategory: { name: "doprava", cents: 9 } });
  });
});
