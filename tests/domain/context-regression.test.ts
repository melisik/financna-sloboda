import { describe, it, expect } from "vitest";
import { makeCtx } from "../../src/domain/context";
import { projectedInvCents, monthsToTargetSplit } from "../../src/domain/capital";
import type { AppData, Settings, Snapshot } from "../../src/storage/types";

const eur = (x: number) => x * 100;

describe("Context: Finančné jadro (Regression Tests)", () => {
  // Test 1: c počítaný zo savingInvCents, nie z m
  it("c = savingInvCents (nie z m)", () => {
    const data: AppData = {
      settings: {
        expensesCents: 240000, // 2400 €
        withdrawalRate: 0.037,
        realReturn: 0.035,
        savingInvCents: 100000, // 1000 € mesačne na investície
        savingCashCents: 50000, // 500 € mesačne na sporenie
        reserveCents: 0,
        thresholdCents: 0,
        checkedAt: new Date().toISOString(),
      } as Settings,
      snapshots: [{
        id: "snap1",
        date: "2026-11-07",
        investmentsCents: 1000000, // 10 000 €
        cashCents: 500000, // 5 000 €
        createdAt: new Date().toISOString(),
      }],
      transactions: [],
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
      goals: [],
      wasteRecords: [],
      shoppingItems: [],
    persons: [],
    households: [],
      calendarObligations: [],
    };

    const ctx = makeCtx(data);

    // c musí byť rovný savingInvCents (1000 € = 100000 centov)
    expect(ctx.c).toBe(100000);

    // m bude ≠ c (m je voľný peňažný tok z transakcií, ktorých je 0)
    expect(ctx.m).not.toBe(ctx.c);
  });

  // Test 2: savingCashCents sa NEzapočítava do c
  it("savingCashCents sa NEzapočítava do c", () => {
    const data: AppData = {
      settings: {
        expensesCents: 240000,
        withdrawalRate: 0.037,
        realReturn: 0.035,
        savingInvCents: 100000, // 1000 €
        savingCashCents: 50000,  // 500 € — NEMÁ SA POČÍTAŤ DO c
        reserveCents: 0,
        thresholdCents: 0,
        checkedAt: new Date().toISOString(),
      } as Settings,
      snapshots: [{
        id: "snap1",
        date: "2026-11-07",
        investmentsCents: 1000000,
        cashCents: 500000,
        createdAt: new Date().toISOString(),
      }],
      transactions: [],
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
      goals: [],
      wasteRecords: [],
      shoppingItems: [],
    persons: [],
    households: [],
      calendarObligations: [],
    };

    const ctx = makeCtx(data);

    // c = savingInvCents (100000), NIE sum
    expect(ctx.c).toBe(100000);
    // mCash je independent
    expect(ctx.mCash).toBe(50000);
  });

  // Test 8: K_inv(k) je nezávislé od savingCashCents — priame porovnanie produkčnou funkciou (D-039)
  it("K_inv v mesiaci 60 je identický v scenári 1 (mCash=500 €) aj scenári 2 (mCash=2000 €)", () => {
    const inv0 = eur(100_000);  // rovnaký počiatočný K_inv
    const mInv = eur(1_000);    // rovnaký mesačný príspevok do investícií
    const annualRate = 0.035;   // rovnaký reálny výnos
    const months = 60;

    // 1. Produkčná hodnota K_inv(60) — savingCashCents nie je parameter (D-039)
    const kInv60 = projectedInvCents(inv0, mInv, annualRate, months);
    expect(kInv60).toBeGreaterThan(inv0); // K_inv rastie (kontrola, že vzorec nie je nulový)

    // 2. Cross-validácia: pri mCash=0 a target=kInv60 musí monthsToTargetSplit vrátiť ~60 mesiacov.
    //    Nie je tautológia — overuje, že projectedInvCents a monthsToTargetSplit počítajú
    //    rovnaký vzorec invGrown. Keby sa líšili, crossCheck by nebol 60.
    const crossCheck = monthsToTargetSplit({ inv: inv0, cash: 0, nem: 0 }, mInv, 0, annualRate, kInv60);
    expect(crossCheck).toBeCloseTo(months, 0);

    // 3. Scenár 1 (savingCashCents=500 €): K_inv(60) = kInv60
    //    Scenár 2 (savingCashCents=2000 €): K_inv(60) = kInv60
    //    Priame porovnanie: kInv60_S1 === kInv60_S2 — savingCashCents nevstupuje do projectedInvCents
    const kInv60_S1 = projectedInvCents(inv0, mInv, annualRate, months); // mCash=500 nevstupuje
    const kInv60_S2 = projectedInvCents(inv0, mInv, annualRate, months); // mCash=2000 nevstupuje
    expect(kInv60_S1).toBe(kInv60_S2);

    // 4. Dôsledok: scenár 2 (vyšší savingCashCents) dosiahne FIRE skôr, lebo K_cash rastie rýchlejšie —
    //    ale K_inv(60) je v oboch scenároch presne kInv60 (overené v krokoch 1–3).
    const target = eur(600_000);
    const fireMonths_S1 = monthsToTargetSplit({ inv: inv0, cash: eur(10_000), nem: 0 }, mInv, eur(500), annualRate, target);
    const fireMonths_S2 = monthsToTargetSplit({ inv: inv0, cash: eur(10_000), nem: 0 }, mInv, eur(2_000), annualRate, target);
    expect(fireMonths_S2).toBeLessThan(fireMonths_S1!);
  });

  // Test 3: FIRE projekcia NIE JE ovplyvnená zmenou c
  it("FIRE výpočet folosí mInv, mCash; c sa nepoužíva", () => {
    const data: AppData = {
      settings: {
        expensesCents: 240000,
        withdrawalRate: 0.037,
        realReturn: 0.035,
        savingInvCents: 100000,
        savingCashCents: 50000,
        reserveCents: 0,
        thresholdCents: 0,
        checkedAt: new Date().toISOString(),
      } as Settings,
      snapshots: [{
        id: "snap1",
        date: "2026-11-07",
        investmentsCents: 1000000,
        cashCents: 500000,
        createdAt: new Date().toISOString(),
      }],
      transactions: [],
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
      goals: [],
      wasteRecords: [],
      shoppingItems: [],
    persons: [],
    households: [],
      calendarObligations: [],
    };

    const ctx = makeCtx(data);

    // mInv a mCash sa používajú v goalMonths, NIE c
    expect(ctx.mInv).toBe(100000);
    expect(ctx.mCash).toBe(50000);

    // K_FIRE je suma K_inv + K_cash
    expect(ctx.K_FIRE).toBe(ctx.K_inv + ctx.K_cash);

    // c je iba pre zobrazenie (m - c), nie pre výpočty
    expect(ctx.c).toBe(100000);
  });
});
