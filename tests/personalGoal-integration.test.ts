import { describe, expect, it } from "vitest";
import { makeCtx } from "../src/domain/context";
import type { AppData, PersonalGoal, Settings, Snapshot } from "../src/storage/types";

// Test helper: create minimal AppData with personal goals
function createTestData(args: {
  settings?: Settings;
  snapshots?: Snapshot[];
  personalGoals?: PersonalGoal[];
}): AppData {
  return {
    settings: args.settings ?? null,
    transactions: [],
    snapshots: args.snapshots ?? [],
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
    personalGoals: args.personalGoals,
    wasteRecords: [],
    shoppingItems: [],
  };
}

function createGoal(partial: Partial<PersonalGoal>): PersonalGoal {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? "goal-1",
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

describe("Personal Goals Integration — Fáza 2", () => {
  // ============================================================
  // TEST 1: No Personal Goals — mCash unchanged
  // ============================================================
  it("TEST 1: No personal goals — mCash stays derived value", () => {
    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
      },
      personalGoals: undefined, // no goals
    });

    const ctx = makeCtx(data);

    // Without goals, mCash = derived.cash
    expect(ctx.mCash).toBe(ctx.derived.cash);
  });

  // ============================================================
  // TEST 2: Single Goal with Monthly Saving — mCash increased
  // ============================================================
  it("TEST 2: Single goal with monthly saving — mCash includes goal contribution", () => {
    const goalContribution = 200 * 100; // 200 €/mesiacne
    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 300 * 100, // base 300 €
      },
      personalGoals: [createGoal({ monthlySavingCents: goalContribution })],
    });

    const ctx = makeCtx(data);

    // mCash = base + goal contribution = 300 + 200
    const expectedMCash = 300 * 100 + goalContribution;
    expect(ctx.mCash).toBe(expectedMCash);
  });

  // ============================================================
  // TEST 3: Multiple Goals — mCash sums all contributions
  // ============================================================
  it("TEST 3: Multiple goals — mCash sums all goal contributions", () => {
    const goal1 = createGoal({
      id: "g1",
      name: "Dovolenka",
      monthlySavingCents: 100 * 100,
    });
    const goal2 = createGoal({
      id: "g2",
      name: "Dom",
      monthlySavingCents: 300 * 100,
    });
    const goal3 = createGoal({
      id: "g3",
      name: "Auto",
      monthlySavingCents: 150 * 100,
    });

    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 200 * 100, // base
      },
      personalGoals: [goal1, goal2, goal3],
    });

    const ctx = makeCtx(data);

    // mCash = 200 + 100 + 300 + 150 = 750
    const expectedMCash = 200 * 100 + 100 * 100 + 300 * 100 + 150 * 100;
    expect(ctx.mCash).toBe(expectedMCash);
  });

  // ============================================================
  // TEST 4: Goals Without Monthly Saving (optional) — mCash unchanged
  // ============================================================
  it("TEST 4: Goals without monthlySavingCents — ignored in mCash calculation", () => {
    const goal = createGoal({
      name: "Future Goal",
      monthlySavingCents: undefined, // no monthly saving specified
    });

    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 250 * 100,
      },
      personalGoals: [goal],
    });

    const ctx = makeCtx(data);

    // mCash = 250 (no addition from goal without monthlySavingCents)
    expect(ctx.mCash).toBe(250 * 100);
  });

  // ============================================================
  // TEST 5: Goals Preserve Other Capital Components
  // ============================================================
  it("TEST 5: Goals do not affect K_inv, K_nem, K_total calculation", () => {
    const goal = createGoal({ monthlySavingCents: 500 * 100 });

    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
      },
      snapshots: [
        {
          id: "snap-1",
          date: "2026-01-01",
          investmentsCents: 50_000 * 100,
          cashCents: 30_000 * 100,
          createdAt: "2026-01-01T00:00:00Z",
        },
      ],
      personalGoals: [goal],
    });

    const ctx = makeCtx(data);

    // K_inv, K_nem should be unchanged
    expect(ctx.K_inv).toBe(50_000 * 100);
    expect(ctx.K_nem).toBe(0); // no properties
    expect(ctx.K_total).toBe(50_000 * 100 + 30_000 * 100); // K_inv + K_cash

    // K_FIRE = K_inv + K_cash (same as before, goals don't change historical snapshot)
    expect(ctx.K_FIRE).toBe(50_000 * 100 + 30_000 * 100);
  });

  // ============================================================
  // TEST 6: High Goal Contribution — Proportional to Base
  // ============================================================
  it("TEST 6: Goal contribution can exceed base mCash", () => {
    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 100 * 100, // base 100 €
      },
      personalGoals: [createGoal({ monthlySavingCents: 1000 * 100 })], // 1000 € for goal
    });

    const ctx = makeCtx(data);

    // mCash = 100 + 1000 = 1100
    expect(ctx.mCash).toBe(1100 * 100);
  });

  // ============================================================
  // TEST 7: Zero Goals Array — Graceful Handling
  // ============================================================
  it("TEST 7: Empty personalGoals array — mCash from settings/derived only", () => {
    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 350 * 100,
      },
      personalGoals: [], // empty array
    });

    const ctx = makeCtx(data);

    // mCash = 350 (no goals, so no additions)
    expect(ctx.mCash).toBe(350 * 100);
  });

  // ============================================================
  // TEST 8: Complex Scenario — Multiple Goals + Rental Income
  // ============================================================
  it("TEST 8: Multiple goals do not interfere with rental income calculations", () => {
    const goals = [
      createGoal({ id: "g1", name: "Dovolenka", monthlySavingCents: 100 * 100 }),
      createGoal({ id: "g2", name: "Dom", monthlySavingCents: 200 * 100 }),
    ];

    const data: AppData = {
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 300 * 100,
      },
      transactions: [],
      snapshots: [],
      properties: [
        {
          id: "prop-1",
          mode: "prenajom",
          valueCents: 300_000 * 100,
          valueDate: "2026-01-01",
          mortgageBalanceCents: 200_000 * 100,
          monthlyRentCents: 1500 * 100, // 1500 € rent
          monthlyPaymentCents: 1200 * 100, // 1200 € payment
          monthlyOtherCostsCents: 200 * 100, // 200 € other costs
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
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
      personalGoals: goals,
      wasteRecords: [],
      shoppingItems: [],
    };

    const ctx = makeCtx(data);

    // mCash should include goal contributions (300 + 100 + 200 = 600)
    expect(ctx.mCash).toBe(600 * 100);

    // K_nem should be calculated correctly from properties
    const expectedKNem = 300_000 * 100 - 200_000 * 100; // value - mortgage
    expect(ctx.K_nem).toBe(expectedKNem);

    // K_total should include K_nem
    expect(ctx.K_total).toBeGreaterThanOrEqual(expectedKNem);
  });

  // ============================================================
  // TEST 9: mInv Unchanged by Goals
  // ============================================================
  it("TEST 9: Personal goals do not affect mInv calculation", () => {
    const goal = createGoal({ monthlySavingCents: 500 * 100 });

    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingInvCents: 1000 * 100, // explicit mInv
      },
      personalGoals: [goal],
    });

    const ctx = makeCtx(data);

    // mInv should not be affected by goals
    expect(ctx.mInv).toBe(1000 * 100);
  });

  // ============================================================
  // TEST 10: Derived Savings + Goals
  // ============================================================
  it("TEST 10: Derived mCash + goals work together", () => {
    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        // No explicit savingCashCents — will use derived
      },
      personalGoals: [createGoal({ monthlySavingCents: 400 * 100 })],
    });

    const ctx = makeCtx(data);

    // mCash = derived.cash + goals
    // derived.cash should be 0 (no transactions), so mCash = 0 + 400 = 400
    expect(ctx.mCash).toBe(ctx.derived.cash + 400 * 100);
  });
});
