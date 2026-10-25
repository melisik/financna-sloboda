import { describe, expect, it } from "vitest";
import { makeCtx, type Ctx } from "../src/domain/context";
import { scenarioDateText } from "../src/domain/scenario";
import type { AppData, Settings, Snapshot } from "../src/storage/types";

const eur = (x: number) => x * 100;
const TODAY = "2026-10-23";
const fmt = (iso: string) => `fmt:${iso}`;

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
  goals: [], wasteRecords: [], shoppingItems: [],
  ...over,
});

// V = 24 000 € → T = 600 000 € (p = 4 %)
const settings: Settings = {
  expensesCents: eur(24_000),
  withdrawalRate: 0.04,
  realReturn: 0.035,
  reserveCents: 0,
  thresholdCents: eur(100),
};

// D_L = 2026-10-14 (ako GC-13), K_inv = 100 000 €, K_cash = 0
const snapshot = (investmentsCents: number, cashCents = 0): Snapshot => ({
  id: "s1",
  date: "2026-10-14",
  investmentsCents,
  cashCents,
  createdAt: "2026-10-14T10:00:00Z",
});

describe("scenarioDateText: dátum cieľa pre mieru výnosu (FR-02, FR-03, D-019)", () => {
  it("bez vyhodnotenia sa dátum nezobrazí", () => {
    const ctx = makeCtx(emptyData({ settings }));
    expect(scenarioDateText(ctx, 0.04, TODAY, fmt)).toBe("—");
  });

  it("bez nastavení nie je cieľ, a preto sa dátum nezobrazí", () => {
    const ctx = makeCtx(emptyData({ snapshots: [snapshot(eur(100_000))] }));
    expect(scenarioDateText(ctx, 0.04, TODAY, fmt)).toBe("—");
  });

  it("K = 100 000 €, m_inv = 500 €, r = 4 %: n = 333,92 → 334 mesiacov, dátum 2054-08-14 (GC-03, GC-13)", () => {
    const ctx = makeCtx(emptyData({ settings: { ...settings, savingInvCents: eur(500) }, snapshots: [snapshot(eur(100_000))] }));
    expect(scenarioDateText(ctx, 0.04, TODAY, fmt)).toBe("fmt:2054-08-14");
  });

  it("ten istý stav s r = 3,5 %: n = 362,10 → 363 mesiacov, dátum 2057-01-14 (GC-23)", () => {
    const ctx = makeCtx(emptyData({ settings: { ...settings, savingInvCents: eur(500) }, snapshots: [snapshot(eur(100_000))] }));
    expect(scenarioDateText(ctx, 0.035, TODAY, fmt)).toBe("fmt:2057-01-14");
  });

  it("cieľ za viac ako 50 rokov sa nezobrazí ako dátum (O-5, GC-12, D-019)", () => {
    // K = 0, m_inv = 100 €, r = 4 %: n = ln(1 + T·i / m) / ln(1 + i) ≈ 926 mesiacov > 600
    const ctx = makeCtx(emptyData({ settings: { ...settings, savingInvCents: eur(100) }, snapshots: [snapshot(0)] }));
    expect(scenarioDateText(ctx, 0.04, TODAY, fmt)).toBe("Viac ako 50 rokov. Zvýš mesačné sporenie, aby sa cieľ priblížil.");
  });

  it("bez kapitálu a sporenia je cieľ nedosiahnuteľný a text vyzve na zadanie sporenia (GC-08, D-224)", () => {
    const ctx = makeCtx(emptyData({ settings, snapshots: [snapshot(0)] }));
    expect(scenarioDateText(ctx, 0.04, TODAY, fmt)).toBe("Pri tomto sporení cieľ nedosiahneš. Zadaj mesačné sporenie.");
  });

  it("hotovosť, ktorá by sa vyčerpala, sa pomenuje mesiacom bez dátumu (FR-02a, D-058)", () => {
    // K_cash = 10 000 €, bez nehnuteľnosti, N − P = −500 € mesačne → K_cash(k) = 10 000 − 500·k < 0 až pri k = 21
    const ctx: Ctx = {
      settings: null,
      latest: snapshot(0, eur(10_000)),
      evaluated: { inv: 0, cash: eur(10_000) },
      capital: { inv: 0, cash: eur(10_000) },
      negative: { inv: false, cash: false },
      shortfall: { inv: 0, cash: 0 },
      derived: { inv: 0, cash: 0 },
      reserve: 0,
      mInv: 0,
      mCash: 0,
      target: eur(600_000),
      realReturn: 0.035,
      rentals: [{ valueCents: 0, mortgageBalanceCents: 0, mortgageRate: 0, paymentCents: 0, netRentCents: -eur(500) }],
      longHorizon: false,
    };
    expect(scenarioDateText(ctx, 0.035, TODAY, fmt)).toBe("Hotovosť by sa vyčerpala v mesiaci 21; dátum sa nezobrazuje.");
  });
});
