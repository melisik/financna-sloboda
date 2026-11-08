import { describe, it, expect } from "vitest";
import type { AppData, Person, Household } from "../src/storage/types";
import { buildBackup, parseBackup } from "../src/storage/backup";

describe("Backup & Restore (Export/Import zálohy)", () => {
  const testPerson: Person = {
    id: "p-test",
    name: "Test Person",
    role: "owner",
    isCurrentUser: true,
    createdAt: "2026-11-08T00:00:00Z",
    updatedAt: "2026-11-08T00:00:00Z",
  };

  const testHousehold: Household = {
    id: "h-test",
    name: "Test Household",
    members: [{ personId: "p-test", memberRole: "admin", joinedAt: "2026-11-08" }],
    defaultSplitRule: { kind: "equal" },
    createdAt: "2026-11-08T00:00:00Z",
    updatedAt: "2026-11-08T00:00:00Z",
  };

  const testData: AppData = {
    settings: {
      expensesCents: 2400000,
      withdrawalRate: 0.037,
      savingInvCents: 100000,
      savingCashCents: 50000,
      realReturn: 0.035,
      reserveCents: 500000,
      thresholdCents: 0,
      checkedAt: "2026-11-08T00:00:00Z",
    },
    transactions: [
      {
        id: "t1",
        date: "2026-11-08",
        type: "sporenie",
        amountCents: 500000,
        createdAt: "2026-11-08T00:00:00Z",
        updatedAt: "2026-11-08T00:00:00Z",
      },
    ],
    snapshots: [
      {
        id: "snap1",
        date: "2026-11-08",
        investmentsCents: 5000000,
        cashCents: 1000000,
        createdAt: "2026-11-08T00:00:00Z",
      },
    ],
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
    persons: [testPerson],
    households: [testHousehold],
  };

  it("1. Export obsahuje všetky stores vrátane persons a households", () => {
    const backup = buildBackup(testData, "2026-11-08T00:00:00Z");

    expect(backup.app).toBe("financna-sloboda");
    expect(backup.schemaVersion).toBeGreaterThan(0);
    expect(backup.settings).toEqual(testData.settings);
    expect(backup.transactions).toHaveLength(1);
    expect(backup.snapshots).toHaveLength(1);
    expect(backup.persons).toHaveLength(1);
    expect(backup.households).toHaveLength(1);
  });

  it("2. Import obnoví všetky údaje", () => {
    const backup = buildBackup(testData, "2026-11-08T00:00:00Z");
    const backupJson = backup;
    const today = "2026-11-08";

    const result = parseBackup(backupJson, today);

    expect(result.ok).toBe(true);
    expect(result.data?.transactions).toHaveLength(1);
    expect(result.data?.snapshots).toHaveLength(1);
    expect(result.data?.persons).toHaveLength(1);
    expect(result.data?.households).toHaveLength(1);
  });

  it("3. Poškodený súbor je odmietnutý", () => {
    const result = parseBackup({ app: "wrong-app", schemaVersion: 1 }, "2026-11-08");

    expect(result.ok).toBe(false);
    expect((result as any).errors?.[0] || "").toMatch(/nepatrí tejto aplikácii/);
  });

  it("4. Nepodporovaná verzia schémy je odmietnutá", () => {
    const result = parseBackup({ app: "financna-sloboda", schemaVersion: 999, exportedAt: "2026-11-08" }, "2026-11-08");

    expect(result.ok).toBe(false);
    expect((result as any).errors?.some((e: string) => e.includes("novšej verzie"))).toBe(true);
  });

  it("5. Prázdna databáza sa dá exportovať a importovať", () => {
    const emptyData: AppData = {
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
      goals: [],
      wasteRecords: [],
      shoppingItems: [],
      persons: [],
      households: [],
    };

    const backup = buildBackup(emptyData, "2026-11-08T00:00:00Z");
    const result = parseBackup(backup, "2026-11-08");

    expect(result.ok).toBe(true);
    expect(result.data?.transactions).toHaveLength(0);
  });

  it("6. Export bez persons a households pracuje s prázdnymi poľami", () => {
    const dataWithoutPersons: AppData = { ...testData, persons: undefined, households: undefined };
    const backup = buildBackup(dataWithoutPersons, "2026-11-08T00:00:00Z");

    expect(backup.persons).toEqual([]);
    expect(backup.households).toEqual([]);
  });

  it("7. Verzia schémy v zalohe je správna", () => {
    const backup = buildBackup(testData, "2026-11-08T00:00:00Z");
    expect(backup.schemaVersion).toBeGreaterThan(19); // Current SCHEMA_VERSION
  });

  it("8. Import vracia počty transakcií a snapshots", () => {
    const backup = buildBackup(testData, "2026-11-08T00:00:00Z");
    const result = parseBackup(backup, "2026-11-08");

    expect(result.ok).toBe(true);
    expect((result as any).counts?.transactions).toBe(1);
    expect((result as any).counts?.snapshots).toBe(1);
  });

  it("9. Záloha JSON je serializable", () => {
    const backup = buildBackup(testData, "2026-11-08T00:00:00Z");
    const json = JSON.stringify(backup);
    const parsed = JSON.parse(json);

    expect(parsed.app).toBe("financna-sloboda");
    expect(parsed.persons).toHaveLength(1);
  });
});
