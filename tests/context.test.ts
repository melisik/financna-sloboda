import { describe, expect, it } from "vitest";
import { makeCtx } from "../src/domain/context";
import type { AppData, Settings, Snapshot, Transaction } from "../src/storage/types";

const eur = (x: number) => x * 100;

const emptyData = (over: Partial<AppData> = {}): AppData => ({
  settings: null,
  transactions: [],
  snapshots: [],
  properties: [],
  assets: [],
  investments: [],
  liabilities: [],
  incomes: [],
  budgets: [],
  recurringExpenses: [],
  stockItems: [],
  recipes: [],
  dogs: [],
  ...over,
});

// V = 24 000 € ročných výdavkov, p = 4 % → T = 600 000 € (FR-01, GC-01)
const settings: Settings = {
  expensesCents: eur(24_000),
  withdrawalRate: 0.04,
  realReturn: 0.035,
  reserveCents: 0,
  thresholdCents: eur(100),
};

// Posledné vyhodnotenie D_L = 2026-09-30: investície 100 000 €, hotovosť 20 000 €
const snap: Snapshot = {
  id: "s1",
  date: "2026-09-30",
  investmentsCents: eur(100_000),
  cashCents: eur(20_000),
  createdAt: "2026-09-30T10:00:00Z",
};

const tx = (over: Partial<Transaction> & Pick<Transaction, "id" | "date" | "type" | "amountCents" | "createdAt">): Transaction => ({
  updatedAt: over.createdAt,
  ...over,
});

describe("makeCtx: kontext prehľadu (FR-01, FR-02, FR-04, D-121)", () => {
  it("bez vyhodnotenia je kapitál 0 a cieľ sa počíta len z nastavení (FR-01, GC-01)", () => {
    const ctx = makeCtx(emptyData({ settings }));
    expect(ctx.latest).toBeNull();
    expect(ctx.capital).toEqual({ inv: 0, cash: 0 });
    // T = V / p = 24 000 € / 0,04 = 600 000 €
    expect(ctx.target).toBe(eur(600_000));
    expect(ctx.longHorizon).toBe(false);
  });

  it("bez nastavení nie je cieľ a výnos je predvolený predpoklad 3,5 % (D-050)", () => {
    const ctx = makeCtx(emptyData({ snapshots: [snap] }));
    expect(ctx.settings).toBeNull();
    expect(ctx.target).toBeNull();
    expect(ctx.realReturn).toBe(0.035);
    expect(ctx.capital).toEqual({ inv: eur(100_000), cash: eur(20_000) });
  });

  it("poplatky sa odpočítajú od reálneho výnosu a výsledok nie je záporný (D-064)", () => {
    const withFees = makeCtx(emptyData({ settings: { ...settings, realReturn: 0.04, feesRate: 0.005 } }));
    expect(withFees.realReturn).toBeCloseTo(0.035, 12);
    const tooHigh = makeCtx(emptyData({ settings: { ...settings, realReturn: 0.035, feesRate: 0.05 } }));
    expect(tooHigh.realReturn).toBe(0);
  });

  it("mesačné sporenie sa odvodí z transakcií; pri histórii kratšej ako 12 mesiacov sa delí jej dĺžkou (D-031)", () => {
    // Prvá transakcia je v auguste 2026, D_L je september 2026 → história 2 mesiace.
    // m_inv = 1 000 € / 2 = 500 €; m_cash = 500 € / 2 = 250 €.
    const ctx = makeCtx(
      emptyData({
        settings,
        snapshots: [snap],
        transactions: [
          tx({ id: "a", date: "2026-08-10", type: "investicia", amountCents: eur(1_000), createdAt: "2026-08-10T10:00:00Z" }),
          tx({ id: "b", date: "2026-09-15", type: "sporenie", amountCents: eur(500), createdAt: "2026-09-15T10:00:00Z" }),
        ],
      }),
    );
    expect(ctx.mInv).toBe(eur(500));
    expect(ctx.mCash).toBe(eur(250));
  });

  it("explicitné m_inv a m_cash v nastaveniach prepíšu odvodené hodnoty (D-031)", () => {
    const ctx = makeCtx(
      emptyData({
        settings: { ...settings, savingInvCents: eur(300), savingCashCents: eur(50) },
        snapshots: [snap],
        transactions: [tx({ id: "b", date: "2026-09-15", type: "sporenie", amountCents: eur(500), createdAt: "2026-09-15T10:00:00Z" })],
      }),
    );
    expect(ctx.mInv).toBe(eur(300));
    expect(ctx.mCash).toBe(eur(50));
  });

  it("transakcia po vyhodnotení sa počíta do K a transakcia pred ním, s dátumom pred ním, nie (FR-04, D-123)", () => {
    const ctx = makeCtx(
      emptyData({
        settings,
        snapshots: [snap],
        transactions: [
          tx({ id: "old", date: "2026-09-01", type: "sporenie", amountCents: eur(999), createdAt: "2026-09-02T10:00:00Z" }),
          tx({ id: "new", date: "2026-10-05", type: "sporenie", amountCents: eur(50), createdAt: "2026-10-05T10:00:00Z" }),
        ],
      }),
    );
    // 20 000 € + 50 € (ručne zadaná položka po vyhodnotení); 999 € je už vo vyhodnotení.
    expect(ctx.capital).toEqual({ inv: eur(100_000), cash: eur(20_050) });
  });

  it("rezerva po vyhodnotení zníži K_cash, ale jej stav je v rezerve (D-047, D-058)", () => {
    const ctx = makeCtx(
      emptyData({
        settings,
        snapshots: [snap],
        transactions: [tx({ id: "r", date: "2026-10-02", type: "rezerva", amountCents: eur(300), createdAt: "2026-10-02T10:00:00Z" })],
      }),
    );
    expect(ctx.capital.cash).toBe(eur(19_700));
    expect(ctx.reserve).toBe(eur(300));
  });

  it("dlhý horizont je viac ako 240 mesiacov (D-065): 250 mesiacov áno, 200 mesiacov nie", () => {
    // T = 600 000 €, K_inv = 100 000 €, r = 0: n = (T − K) / m. m = 2 000 € → 250; m = 2 500 € → 200.
    const noReturn = { ...settings, realReturn: 0 };
    const cashless = { ...snap, cashCents: 0 };
    const long = makeCtx(emptyData({ settings: { ...noReturn, savingInvCents: eur(2_000) }, snapshots: [cashless] }));
    expect(long.longHorizon).toBe(true);
    const short = makeCtx(emptyData({ settings: { ...noReturn, savingInvCents: eur(2_500) }, snapshots: [cashless] }));
    expect(short.longHorizon).toBe(false);
  });
});
