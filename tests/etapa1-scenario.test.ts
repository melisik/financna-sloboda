import { describe, expect, it } from "vitest";
import type { AppData } from "../src/storage/types";
import { makeCtx } from "../src/domain/context";

const eur = (x: number) => x * 100;

describe("ETAPA 1: Finančný scenár s nehnuteľnosťami a voľným peňažným tokom", () => {
  const baseData: AppData = {
    settings: {
      expensesCents: eur(2000),
      withdrawalRate: 0.04,
      realReturn: 0.035,
      reserveCents: eur(5000),
      thresholdCents: 500,
    },
    snapshots: [
      {
        id: "snap1",
        date: "2026-10-31",
        investmentsCents: eur(60_000),
        cashCents: eur(20_000),
        createdAt: "2026-10-31T23:59:59Z",
      },
    ],
    transactions: [
      // Mesačné príjmy (skrz mesiac) — pred snapshot
      { id: "t1", date: "2026-10-05", type: "sporenie", amountCents: eur(3000), createdAt: "2026-10-05T00:00:00Z", updatedAt: "2026-10-05T00:00:00Z" },
      { id: "t2", date: "2026-10-20", type: "sporenie", amountCents: eur(2500), createdAt: "2026-10-20T00:00:00Z", updatedAt: "2026-10-20T00:00:00Z" },
      // Mesačné výdavky (vrátane splátok hypoték) — pred snapshot
      { id: "t3", date: "2026-10-10", type: "vydavok", amountCents: eur(1500), category: "jedlo", createdAt: "2026-10-10T00:00:00Z", updatedAt: "2026-10-10T00:00:00Z", source: "z_hotovosti" },
      { id: "t4", date: "2026-10-25", type: "vydavok", amountCents: eur(800), category: "bývanie", createdAt: "2026-10-25T00:00:00Z", updatedAt: "2026-10-25T00:00:00Z", source: "z_hotovosti" }, // Splátka hypotéky
    ],
    properties: [
      {
        id: "prop1",
        name: "Vlastné bývanie",
        mode: "vlastne_byvanie",
        valueCents: eur(300_000),
        valueDate: "2026-10-01",
        mortgageBalanceCents: eur(200_000),
        balanceDate: "2026-10-01",
        monthlyPaymentCents: eur(1000),
        mortgageRate: 0.03,
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
      },
      {
        id: "prop2",
        name: "Prenajímaná nehnuteľnosť",
        mode: "prenajom",
        valueCents: eur(150_000),
        valueDate: "2026-10-01",
        mortgageBalanceCents: eur(50_000),
        balanceDate: "2026-10-01",
        monthlyPaymentCents: eur(500),
        mortgageRate: 0.025,
        monthlyRentCents: eur(900),
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
      },
    ],
    budgets: [],
    recurringExpenses: [],
    incomes: [
      {
        id: "inc1",
        name: "Príjmy",
        kind: "ine" as const,
        frequency: "mesacne" as const,
        amountCents: eur(5500),
        startDate: "2026-10-01",
        createdAt: "2026-10-01T00:00:00Z",
        updatedAt: "2026-10-01T00:00:00Z",
      },
    ],
    investments: [],
    liabilities: [],
    assets: [],
    recipes: [],
    stockItems: [],
    goals: [],
    wasteRecords: [],
    shoppingItems: [],
    dogs: [],
  };

  it("K_nem: vlastné bývanie (300 000) + prenajom (150 000) mínus ich hypotéky (200 000 + 50 000) = 200 000", () => {
    const ctx = makeCtx(baseData);
    const expectedKnem = eur(200_000); // (300 000 - 200 000) + (150 000 - 50 000)
    expect(ctx.K_nem).toBe(expectedKnem);
  });

  it("K_total: K_inv (60 000) + K_cash (20 000) + K_nem (200 000) = 280 000", () => {
    const ctx = makeCtx(baseData);
    const expectedKtotal = eur(280_000);
    expect(ctx.K_total).toBe(expectedKtotal);
  });

  it("K_FIRE: K_inv (60 000) + K_cash (20 000) = 80 000 (bez K_nem)", () => {
    const ctx = makeCtx(baseData);
    const expectedKfire = eur(80_000);
    expect(ctx.K_FIRE).toBe(expectedKfire);
  });

  it("m: voľný peňažný tok = 0 EUR (transakcie sú v mesiaci snapshotu, vylúčené)", () => {
    const ctx = makeCtx(baseData);
    // Snapshot: 31.10.2026
    // Sledované obdobie: 1.10.2025 až 30.9.2026 (12 mesiacov PRED snapshotu)
    // Všetky transakcie sú v októbri 2026 (mesiac snapshotu) → MIMO periody
    // Príjmy: 0 EUR (žiadne type="prijem")
    // Výdavky: 0 EUR (mimo periody)
    // m = (0 - 0) / 12 = 0 centov
    const expectedM = 0;
    expect(ctx.m).toBe(expectedM);
  });

  it("Vlastné bývanie je v K_total ale nie v K_FIRE", () => {
    const ctx = makeCtx(baseData);
    expect(ctx.K_nem).toBeGreaterThan(0); // K_nem vrátane vlastného byvania
    expect(ctx.K_FIRE).toBe(eur(80_000)); // K_FIRE bez K_nem
    expect(ctx.K_total).toBeGreaterThan(ctx.K_FIRE); // K_total > K_FIRE
  });

  it("Investície sa nepočítajú duplicitne", () => {
    const ctx = makeCtx(baseData);
    // K_inv = 60 000 (len z investícií)
    // K_nem = 200 000 (len z nehnuteľností)
    // Žiadna duplikácia
    expect(ctx.K_inv).toBe(eur(60_000));
    expect(ctx.K_nem).toBe(eur(200_000));
    expect(ctx.K_inv + ctx.K_cash + ctx.K_nem).toBe(ctx.K_total);
  });
});
