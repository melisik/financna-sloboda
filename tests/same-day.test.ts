import { describe, expect, it } from "vitest";
import { capitalWithFlags, isAfterEvaluation } from "../src/domain/ledger";
import type { Snapshot, Transaction } from "../src/storage/types";

// Pravidlo D-121: transakcia v deň vyhodnotenia sa počíta, ak bola zadaná po ňom. Syntetické hodnoty.
const snap: Snapshot = { id: "s", date: "2026-10-20", investmentsCents: 31_000_000, cashCents: 0, createdAt: "2026-10-20T10:00:00.000Z" };

function expense(id: string, date: string, createdAt: string, amountCents: number): Transaction {
  return { id, date, type: "vydavok", amountCents, source: "z_investicii", createdAt } as Transaction;
}

describe("prečerpanie investícií (nález 3, D-167)", () => {
  it("suma nad K_inv sa zobrazí ako prečerpanie a do K sa nezapočíta", () => {
    const r = capitalWithFlags(snap, [expense("x", "2026-10-21", "2026-10-21T09:00:00.000Z", 31_050_000)]);
    expect(r.capital.inv).toBe(0);
    expect(r.negative.inv).toBe(true);
    expect(r.shortfall.inv).toBe(50_000);
  });
});

describe("pravidlo D-121: transakcie v deň vyhodnotenia", () => {
  it("transakcia zadaná po vyhodnotení v ten istý deň sa odpočíta", () => {
    const t = expense("a", "2026-10-20", "2026-10-20T11:00:00.000Z", 15_000);
    expect(capitalWithFlags(snap, [t]).capital.inv).toBe(31_000_000 - 15_000);
  });

  it("transakcia zadaná pred vyhodnotením v ten istý deň sa nepridá znovu", () => {
    const t = expense("b", "2026-10-20", "2026-10-20T09:00:00.000Z", 15_000);
    expect(capitalWithFlags(snap, [t]).capital.inv).toBe(31_000_000);
  });

  it("transakcia s dátumom pred vyhodnotením, zadaná pred ním, sa nepridá", () => {
    const t = expense("c", "2026-10-19", "2026-10-20T09:00:00.000Z", 15_000);
    expect(capitalWithFlags(snap, [t]).capital.inv).toBe(31_000_000);
  });

  it("zabudnutá transakcia s dátumom pred vyhodnotením, zadaná po ňom, sa odpočíta (D-123)", () => {
    const t = expense("g", "2026-10-19", "2026-10-20T11:00:00.000Z", 15_000);
    expect(capitalWithFlags(snap, [t]).capital.inv).toBe(31_000_000 - 15_000);
  });

  it("transakcia s neskorším dátumom sa odpočíta", () => {
    const t = expense("d", "2026-10-21", "2026-10-20T09:00:00.000Z", 15_000);
    expect(capitalWithFlags(snap, [t]).capital.inv).toBe(31_000_000 - 15_000);
  });

  it("isAfterEvaluation: rozhoduje dátum alebo čas zadania po vyhodnotení", () => {
    expect(isAfterEvaluation(expense("e", "2026-10-20", "2026-10-20T10:00:00.001Z", 1), snap)).toBe(true);
    expect(isAfterEvaluation(expense("f", "2026-10-20", "2026-10-20T10:00:00.000Z", 1), snap)).toBe(false);
    expect(isAfterEvaluation(expense("h", "2026-10-19", "2026-10-21T10:00:00.000Z", 1), snap)).toBe(true);
  });
});
