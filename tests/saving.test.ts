import { describe, expect, it } from "vitest";
import { monthlySaving } from "../src/domain/saving";
import type { Transaction } from "../src/storage/types";

const tx = (date: string, type: Transaction["type"], amountCents: number): Transaction => ({
  id: `${date}-${type}`, date, type, amountCents, createdAt: date, updatedAt: date,
});

describe("odvodené mesačné sporenie m (D-017, D-031, D-040)", () => {
  // GC-16: tri mesiace sporenia po 500 € → m = 1 500 / 3 = 500 (nie 125)
  it("GC-16: tri mesiace po 500 € dajú m = 500 €", () => {
    const txs = [
      tx("2026-08-10", "sporenie", 50_000),
      tx("2026-09-10", "sporenie", 50_000),
      tx("2026-10-10", "sporenie", 50_000),
    ];
    expect(monthlySaving(txs, "2026-10-31")).toEqual({ inv: 0, cash: 50_000 });
  });

  it("investícia a sporenie sa rozdelia do m_inv a m_cash", () => {
    const txs = [tx("2026-10-01", "investicia", 30_000), tx("2026-10-02", "sporenie", 10_000)];
    expect(monthlySaving(txs, "2026-10-31")).toEqual({ inv: 30_000, cash: 10_000 });
  });

  it("transakcie staršie ako 12 mesiacov a po D_L sa nepočítajú", () => {
    const txs = [
      tx("2025-09-30", "sporenie", 99_999), // mimo okna
      tx("2026-10-05", "sporenie", 12_000),
      tx("2026-11-02", "sporenie", 77_777), // po D_L
    ];
    // História začína prvou transakciou (09/2025), je dlhšia ako 12 mesiacov, delí sa 12 (D-040):
    // 12 000 / 12 = 1 000 (centov) mesačne.
    expect(monthlySaving(txs, "2026-10-31")).toEqual({ inv: 0, cash: 1_000 });
  });

  it("bez transakcií je m = 0", () => {
    expect(monthlySaving([], "2026-10-31")).toEqual({ inv: 0, cash: 0 });
  });
});
