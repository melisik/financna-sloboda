import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { buildCompleteSnapshot } from "../src/app/snapshotBuilder";
import type { AppData } from "../src/storage/types";

// Syntetické testovacie dáta
function createTestAppData(overrides?: Partial<AppData>): AppData {
  return {
    persons: [],
    households: [],
    settings: {
      expensesCents: 2400000, // 24 000 €
      withdrawalRate: 0.037,
      realReturn: 0.035,
      reserveCents: 500000, // 5 000 €
      thresholdCents: 10000, // 100 €
    },
    snapshots: [],
    transactions: [],
    properties: [],
    liabilities: [],
    investments: [],
    assets: [],
    incomes: [],
    budgets: [],
    recurringExpenses: [],
    recipes: [],
    dogs: [],
    attachments: [],
    rentalEntries: [],
    wasteRecords: [],
    shoppingItems: [],
    goals: [],
    ...overrides,
  } as AppData;
}

describe("buildCompleteSnapshot()", () => {
  it("K_FIRE = K_inv + K_cash (oba sú zadané)", () => {
    const data = createTestAppData();
    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: false,
      id: "test-1",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 10000000, // 100 000 €
      cashCents: 5000000, // 50 000 €
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot!.investmentsCents).toBe(10000000);
    expect(snapshot!.cashCents).toBe(5000000);
    expect(snapshot!.fireCapitalCents).toBe(15000000); // 150 000 €
  });

  it("K_nem = suma čistých hodnôt nehnuteľností (hodnota MÍNUS hypotéka, nie iné záväzky)", () => {
    const data = createTestAppData({
      properties: [
        {
          id: "prop-1",
          name: "Byt",
          mode: "vlastne_byvanie",
          valueCents: 30000000, // 300 000 €
          valueDate: "2026-11-01",
          mortgageBalanceCents: 10000000, // 100 000 € hypotéka
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      liabilities: [
        {
          id: "lia-1",
          name: "Pôžička",
          kind: "uver",
          balanceCents: 5000000, // 50 000 € — NIEODPOČÍTA sa z K_nem, je samostatne!
          rate: 0.04,
          monthlyPaymentCents: 50000,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: false,
      id: "test-2",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 0,
      cashCents: 0,
    });

    expect(snapshot).not.toBeNull();
    // K_nem = čisté hodnoty nehnuteľností (hypotéka sa odpočíta, ale iné záväzky NIE)
    // K_nem = 300k - 100k = 200k (iné záväzky sa neodpočítavajú)
    expect(snapshot!.netPropertyValueCents).toBe(20000000);
    // Kontrola propertyBreakdown
    expect(snapshot!.propertyBreakdown).toHaveLength(1);
    expect(snapshot!.propertyBreakdown![0].netValueCents).toBe(20000000); // 300k - 100k = 200k
    // Kontrola liabilityBreakdown
    expect(snapshot!.liabilityBreakdown).toHaveLength(1);
    expect(snapshot!.liabilityBreakdown![0].balanceCents).toBe(5000000); // Samostatne
  });

  it("K_total = K_FIRE + K_nem", () => {
    const data = createTestAppData({
      properties: [
        {
          id: "prop-1",
          name: "Byt",
          mode: "vlastne_byvanie",
          valueCents: 30000000,
          valueDate: "2026-11-01",
          mortgageBalanceCents: 10000000,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: false,
      id: "test-3",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 10000000, // 100 000 €
      cashCents: 5000000, // 50 000 €
    });

    expect(snapshot).not.toBeNull();
    // K_FIRE = 100k + 50k = 150k
    // K_nem = 300k - 100k = 200k
    // K_total = 150k + 200k = 350k
    expect(snapshot!.fireCapitalCents).toBe(15000000);
    expect(snapshot!.netPropertyValueCents).toBe(20000000);
    expect(snapshot!.totalNetWorthCents).toBe(35000000);
  });

  it("Hypotéka sa odpočíta presne raz", () => {
    const data = createTestAppData({
      properties: [
        {
          id: "prop-1",
          name: "Byt s hypotékou",
          mode: "vlastne_byvanie",
          valueCents: 30000000,
          valueDate: "2026-11-01",
          mortgageBalanceCents: 10000000,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: false,
      id: "test-4",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 0,
      cashCents: 0,
    });

    expect(snapshot).not.toBeNull();
    // propertyBreakdown pre hypotekovanú nehnuteľnosť
    const breakdown = snapshot!.propertyBreakdown![0];
    expect(breakdown.valueCents).toBe(30000000);
    expect(breakdown.mortgageBalanceCents).toBe(10000000);
    expect(breakdown.netValueCents).toBe(20000000); // 300k - 100k
    // K_nem by mal byť 200k, nie 100k (nie dvojitý odpočet)
    expect(snapshot!.netPropertyValueCents).toBe(20000000);
  });

  it("Korektne sa ukladajú propertyBreakdown a liabilityBreakdown", () => {
    const data = createTestAppData({
      properties: [
        {
          id: "prop-1",
          name: "Byt",
          mode: "vlastne_byvanie",
          valueCents: 20000000,
          valueDate: "2026-11-01",
          mortgageBalanceCents: 8000000,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
        {
          id: "prop-2",
          name: "Chata",
          mode: "nezadane",
          valueCents: 10000000,
          valueDate: "2026-11-01",
          mortgageBalanceCents: 0,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
      liabilities: [
        {
          id: "lia-1",
          name: "Úver",
          kind: "uver",
          balanceCents: 3000000,
          rate: 0.05,
          monthlyPaymentCents: 50000,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: false,
      id: "test-5",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 0,
      cashCents: 0,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot!.propertyBreakdown).toHaveLength(2);
    expect(snapshot!.propertyBreakdown![0].name).toBe("Byt");
    expect(snapshot!.propertyBreakdown![1].name).toBe("Chata");

    expect(snapshot!.liabilityBreakdown).toHaveLength(1);
    expect(snapshot!.liabilityBreakdown![0].name).toBe("Úver");
    expect(snapshot!.liabilityBreakdown![0].balanceCents).toBe(3000000);
  });

  it("Snapshot bez nehnuteľností a záväzkov je platný", () => {
    const data = createTestAppData();

    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: false,
      id: "test-6",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 10000000,
      cashCents: 5000000,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot!.fireCapitalCents).toBe(15000000);
    expect(snapshot!.netPropertyValueCents).toBe(0);
    expect(snapshot!.propertyBreakdown).toBeUndefined(); // Nebude uložený, lebo je prázdny
    expect(snapshot!.liabilityBreakdown).toBeUndefined();
    expect(snapshot!.totalNetWorthCents).toBe(15000000); // Len K_FIRE
  });

  it("Snapshot obsahuje vlastnú kópiu rozpisov a nemení sa pri zmene zdrojových údajov", () => {
    const data = createTestAppData({
      properties: [
        {
          id: "prop-1",
          name: "Byt",
          mode: "vlastne_byvanie",
          valueCents: 30000000,
          valueDate: "2026-11-01",
          mortgageBalanceCents: 10000000,
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
        },
      ],
    });

    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: false,
      id: "test-7",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 0,
      cashCents: 0,
    });

    expect(snapshot).not.toBeNull();
    const originalNetValue = snapshot!.propertyBreakdown![0].netValueCents;

    // Zmenme zdrojové údaje
    data.properties[0].valueCents = 50000000;

    // Snapshot zostáva nezmenený
    expect(snapshot!.propertyBreakdown![0].valueCents).toBe(30000000);
    expect(snapshot!.propertyBreakdown![0].netValueCents).toBe(originalNetValue);
  });

  it("Snapshot označený ako automatický má auto=true", () => {
    const data = createTestAppData();
    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: true,
      id: "test-8",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 10000000,
      cashCents: 5000000,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot!.auto).toBe(true);
  });

  it("Ručný snapshot nemá auto flag alebo je undefined", () => {
    const data = createTestAppData();
    const snapshot = buildCompleteSnapshot({
      data,
      date: "2026-11-09",
      isAuto: false,
      id: "test-9",
      now: "2026-11-09T10:00:00Z",
      investmentsCents: 10000000,
      cashCents: 5000000,
    });

    expect(snapshot).not.toBeNull();
    expect(snapshot!.auto).toBeUndefined();
  });
});
