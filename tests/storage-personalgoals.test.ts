import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import { openDB } from "idb";
import { openRepository } from "../src/storage/indexeddb";
import type { AppData, PersonalGoal } from "../src/storage/types";

function freshName(): string {
  return `vitest-test-db-${Math.random().toString(36).slice(2)}`;
}

function createGoal(partial: Partial<PersonalGoal> = {}): PersonalGoal {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? `goal-${Math.random().toString(36).slice(2)}`,
    name: partial.name ?? "Test Goal",
    targetCents: partial.targetCents ?? 10_000 * 100,
    category: partial.category ?? "dovolena",
    priority: partial.priority ?? 1,
    targetYear: partial.targetYear ?? 2027,
    targetMonth: partial.targetMonth,
    flexible: partial.flexible,
    monthlySavingCents: partial.monthlySavingCents,
    note: partial.note,
    createdAt: now,
    updatedAt: now,
  };
}

describe("Storage — Personal Goals Persistence (Fáza 2)", () => {
  // ============================================================
  // TEST 1: Create and Save Personal Goal
  // ============================================================
  it("TEST 1: Save personal goal to IndexedDB", async () => {
    const dbName = freshName();
    const repo = await openRepository(dbName);

    const goal = createGoal({ id: "g1", name: "Holiday", targetCents: 5000 * 100 });

    await repo.savePersonalGoal(goal);

    const data = await repo.getData();
    expect(data.personalGoals).toBeDefined();
    expect(data.personalGoals?.length).toBe(1);
    expect(data.personalGoals?.[0]?.id).toBe("g1");
    expect(data.personalGoals?.[0]?.name).toBe("Holiday");
    expect(data.personalGoals?.[0]?.targetCents).toBe(5000 * 100);

    repo.close();
  });

  // ============================================================
  // TEST 2: Load Saved Personal Goal
  // ============================================================
  it("TEST 2: Load saved personal goal after closing and reopening", async () => {
    const dbName = freshName();
    const repo1 = await openRepository(dbName);

    const goal = createGoal({ id: "g2", name: "Training", targetCents: 3000 * 100 });
    await repo1.savePersonalGoal(goal);
    repo1.close();

    // Reopen database
    const repo2 = await openRepository(dbName);
    const data = await repo2.getData();

    expect(data.personalGoals?.length).toBe(1);
    expect(data.personalGoals?.[0]?.id).toBe("g2");
    expect(data.personalGoals?.[0]?.name).toBe("Training");

    repo2.close();
  });

  // ============================================================
  // TEST 3: Update Personal Goal
  // ============================================================
  it("TEST 3: Update personal goal by saving with same ID", async () => {
    const dbName = freshName();
    const repo = await openRepository(dbName);

    const goal1 = createGoal({ id: "g3", name: "Original", targetCents: 1000 * 100 });
    await repo.savePersonalGoal(goal1);

    const goal2 = createGoal({ id: "g3", name: "Updated", targetCents: 2000 * 100 });
    await repo.savePersonalGoal(goal2);

    const data = await repo.getData();
    expect(data.personalGoals?.length).toBe(1);
    expect(data.personalGoals?.[0]?.name).toBe("Updated");
    expect(data.personalGoals?.[0]?.targetCents).toBe(2000 * 100);

    repo.close();
  });

  // ============================================================
  // TEST 4: Delete Personal Goal
  // ============================================================
  it("TEST 4: Delete personal goal", async () => {
    const dbName = freshName();
    const repo = await openRepository(dbName);

    const goal = createGoal({ id: "g4" });
    await repo.savePersonalGoal(goal);

    let data = await repo.getData();
    expect(data.personalGoals?.length).toBe(1);

    await repo.deletePersonalGoal("g4");

    data = await repo.getData();
    expect(data.personalGoals?.length).toBe(0);

    repo.close();
  });

  // ============================================================
  // TEST 5: Multiple Simultaneous Personal Goals
  // ============================================================
  it("TEST 5: Multiple personal goals persist independently", async () => {
    const dbName = freshName();
    const repo = await openRepository(dbName);

    const goal1 = createGoal({ id: "g5a", name: "Goal 1", targetCents: 5000 * 100 });
    const goal2 = createGoal({ id: "g5b", name: "Goal 2", targetCents: 3000 * 100 });
    const goal3 = createGoal({ id: "g5c", name: "Goal 3", targetCents: 10_000 * 100 });

    await repo.savePersonalGoal(goal1);
    await repo.savePersonalGoal(goal2);
    await repo.savePersonalGoal(goal3);

    const data = await repo.getData();
    expect(data.personalGoals?.length).toBe(3);
    expect(data.personalGoals?.map((g: PersonalGoal) => g.id).sort()).toEqual(["g5a", "g5b", "g5c"]);

    repo.close();
  });

  // ============================================================
  // TEST 6: Load Old Data Without personalGoals (v13 Compatibility)
  // ============================================================
  it("TEST 6: Load data from v13 (without personalGoals field)", async () => {
    const dbName = freshName();

    // Simulate v13 data by creating a database without personalGoals
    const db = await openDB(dbName, 13, {
      upgrade(upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains("settings")) {
          upgradeDb.createObjectStore("settings");
        }
        if (!upgradeDb.objectStoreNames.contains("transactions")) {
          upgradeDb.createObjectStore("transactions", { keyPath: "id" });
        }
        if (!upgradeDb.objectStoreNames.contains("snapshots")) {
          upgradeDb.createObjectStore("snapshots", { keyPath: "id" });
        }
      },
    });

    await db.put("settings", { expensesCents: 100_000 * 100 }, "settings");

    db.close();

    // Now open with IdbRepository (v14+)
    const repo = await openRepository(dbName);
    const data = await repo.getData();

    // personalGoals should be an empty array (default), not undefined
    expect(data.personalGoals).toBeDefined();
    expect(Array.isArray(data.personalGoals)).toBe(true);
    expect(data.personalGoals?.length).toBe(0);

    repo.close();
  });

  // ============================================================
  // TEST 7: FIRE Calculations Remain Independent of Personal Goals
  // ============================================================
  it("TEST 7: Personal goals don't affect FIRE-related data", async () => {
    const dbName = freshName();
    const repo = await openRepository(dbName);

    const settings = {
      expensesCents: 100_000 * 100,
      withdrawalRate: 0.04,
      realReturn: 0.035,
      reserveCents: 50_000 * 100,
      thresholdCents: 1_000 * 100,
    };

    const snapshot = {
      id: "snap-1",
      date: "2026-01-01",
      investmentsCents: 50_000 * 100,
      cashCents: 30_000 * 100,
      createdAt: new Date().toISOString(),
    };

    // Use replaceAll to set up baseline data with settings and snapshots
    const baselineData: AppData = {
      settings,
      transactions: [],
      snapshots: [snapshot],
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
      personalGoals: [],
      wasteRecords: [],
      shoppingItems: [],
      persons: [],
      households: [],
      calendarObligations: [],
    };

    await repo.replaceAll(baselineData);

    // Add personal goals
    const goal1 = createGoal({ id: "gfire1", monthlySavingCents: 500 * 100 });
    const goal2 = createGoal({ id: "gfire2", monthlySavingCents: 300 * 100 });

    await repo.savePersonalGoal(goal1);
    await repo.savePersonalGoal(goal2);

    const data = await repo.getData();

    // FIRE-related data should be unchanged
    expect(data.settings?.expensesCents).toBe(100_000 * 100);
    expect(data.snapshots?.length).toBe(1);
    expect(data.snapshots?.[0]?.investmentsCents).toBe(50_000 * 100);
    expect(data.snapshots?.[0]?.cashCents).toBe(30_000 * 100);

    // But personal goals should be stored
    expect(data.personalGoals?.length).toBe(2);

    repo.close();
  });

  // ============================================================
  // TEST 8: replaceAll() Maintains Atomicity with Personal Goals
  // ============================================================
  it("TEST 8: replaceAll() atomically replaces personalGoals with other data", async () => {
    const dbName = freshName();
    const repo = await openRepository(dbName);

    // Set up initial state with personal goals
    const goal1 = createGoal({ id: "g8a" });
    await repo.savePersonalGoal(goal1);

    let data = await repo.getData();
    expect(data.personalGoals?.length).toBe(1);

    // Use replaceAll with different personal goals
    const goal2 = createGoal({ id: "g8b", name: "New Goal" });
    const goal3 = createGoal({ id: "g8c", name: "Another Goal" });

    const newData: AppData = {
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
      personalGoals: [goal2, goal3],
      wasteRecords: [],
      shoppingItems: [],
      persons: [],
      households: [],
      calendarObligations: [],
    };

    await repo.replaceAll(newData);

    data = await repo.getData();

    // Old goal should be gone, new goals should be there
    expect(data.personalGoals?.length).toBe(2);
    expect(data.personalGoals?.map((g: PersonalGoal) => g.id).sort()).toEqual(["g8b", "g8c"]);

    repo.close();
  });
});
