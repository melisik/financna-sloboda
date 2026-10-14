import { describe, expect, it } from "vitest";
import { currentCapital, reserveBalance } from "../src/app/ledger";
import type { Snapshot, Transaction } from "../src/storage/types";

const eur = (x: number) => x * 100;
const snap: Snapshot = { id: "s", date: "2026-09-30", investmentsCents: eur(100_000), cashCents: eur(20_000), createdAt: "x" };
const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(36).slice(2),
  date: "2026-10-05",
  type: "sporenie",
  amountCents: eur(100),
  createdAt: "2026-10-05T10:00:00Z",
  updatedAt: "2026-10-05T10:00:00Z",
  ...over,
});

describe("currentCapital (FR-04, FR-05)", () => {
  it("bez vyhodnotenia je kapitál 0", () => {
    expect(currentCapital(null, [])).toEqual({ inv: 0, cash: 0 });
  });

  it("transakcie s dátumom ≤ D_L sa nepridajú znovu", () => {
    const old = tx({ date: "2026-09-15", type: "sporenie", amountCents: eur(999) });
    expect(currentCapital(snap, [old])).toEqual({ inv: eur(100_000), cash: eur(20_000) });
  });

  it("sporenie zvyšuje K_cash, investícia z príjmu K_inv", () => {
    const r = currentCapital(snap, [tx({ type: "sporenie", amountCents: eur(500) }), tx({ type: "investicia", amountCents: eur(1000) })]);
    expect(r).toEqual({ inv: eur(101_000), cash: eur(20_500) });
  });

  it("presun hotovosti do investícií nemení K (D-045)", () => {
    const before = currentCapital(snap, []);
    const after = currentCapital(snap, [tx({ type: "investicia", source: "z_hotovosti", amountCents: eur(5_000) })]);
    expect(before.inv + before.cash).toBe(after.inv + after.cash);
    expect(after).toEqual({ inv: eur(105_000), cash: eur(15_000) });
  });

  it("výdavok z hotovosti znižuje K_cash, z investícií K_inv, z príjmu nič", () => {
    expect(currentCapital(snap, [tx({ type: "vydavok", source: "z_hotovosti", amountCents: eur(10_000) })])).toEqual({ inv: eur(100_000), cash: eur(10_000) });
    expect(currentCapital(snap, [tx({ type: "vydavok", source: "z_investicii", amountCents: eur(10_000) })])).toEqual({ inv: eur(90_000), cash: eur(20_000) });
    expect(currentCapital(snap, [tx({ type: "vydavok", source: "z_prijmu", amountCents: eur(10_000) })])).toEqual({ inv: eur(100_000), cash: eur(20_000) });
  });

  it("výdavky nad kapitál sa zarazia na 0 (H2)", () => {
    const r = currentCapital(snap, [tx({ type: "vydavok", source: "z_investicii", amountCents: eur(60_000) }), tx({ type: "vydavok", source: "z_investicii", amountCents: eur(60_000), date: "2026-10-06" })]);
    expect(r.inv).toBe(0);
  });
});

describe("reserveBalance (D-047)", () => {
  it("vklady mínus výbery", () => {
    const txs = [tx({ type: "rezerva", amountCents: eur(6_000) }), tx({ type: "vyber_rezervy", amountCents: eur(1_000) })];
    expect(reserveBalance(txs)).toBe(eur(5_000));
  });
});
