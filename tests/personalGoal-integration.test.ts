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

describe("Personal Goals Integration — Lineárny Model", () => {
  // ============================================================
  // TEST 1: mCash Remains Independent of Personal Goals
  // ============================================================
  it("TEST 1: mCash stays independent — personal goals don't modify it", () => {
    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 300 * 100, // base 300 €
      },
      personalGoals: [
        createGoal({ monthlySavingCents: 200 * 100 }),
        createGoal({ id: "g2", monthlySavingCents: 150 * 100 }),
      ],
    });

    const ctx = makeCtx(data);

    // mCash should be ONLY the base savings, NOT including goal contributions
    expect(ctx.mCash).toBe(300 * 100); // NOT 300 + 200 + 150
  });

  // ============================================================
  // TEST 2: FIRE Capital Unaffected by Personal Goals
  // ============================================================
  it("TEST 2: K_FIRE remains unaffected by personal goals", () => {
    const snap: Snapshot = {
      id: "snap-1",
      date: "2026-01-01",
      investmentsCents: 50_000 * 100,
      cashCents: 30_000 * 100,
      createdAt: "2026-01-01T00:00:00Z",
    };

    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
      },
      snapshots: [snap],
      personalGoals: [
        createGoal({ monthlySavingCents: 500 * 100 }),
        createGoal({ id: "g2", monthlySavingCents: 300 * 100 }),
      ],
    });

    const ctx = makeCtx(data);

    // K_FIRE = K_inv + K_cash (from snapshot, unaffected by goals)
    expect(ctx.K_FIRE).toBe(50_000 * 100 + 30_000 * 100);
  });

  // ============================================================
  // TEST 3: mInv Unchanged by Personal Goals
  // ============================================================
  it("TEST 3: mInv is not affected by personal goals", () => {
    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingInvCents: 1000 * 100, // explicit mInv
      },
      personalGoals: [createGoal({ monthlySavingCents: 500 * 100 })],
    });

    const ctx = makeCtx(data);

    expect(ctx.mInv).toBe(1000 * 100); // Unchanged
  });

  // ============================================================
  // TEST 4: Personal Goals Array Can Be Undefined
  // ============================================================
  it("TEST 4: Systems work when personalGoals is undefined", () => {
    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 250 * 100,
      },
      personalGoals: undefined, // No goals
    });

    const ctx = makeCtx(data);

    expect(ctx.mCash).toBe(250 * 100);
    expect(ctx.K_FIRE).toBeDefined();
  });

  // ============================================================
  // TEST 5: Multiple Personal Goals — All Independent
  // ============================================================
  it("TEST 5: Multiple personal goals exist independently", () => {
    const goals = [
      createGoal({
        id: "g1",
        name: "Dovolenka",
        targetCents: 5000 * 100,
        monthlySavingCents: 200 * 100,
      }),
      createGoal({
        id: "g2",
        name: "Školenie",
        targetCents: 3000 * 100,
        monthlySavingCents: 100 * 100,
      }),
      createGoal({
        id: "g3",
        name: "Dom",
        targetCents: 100_000 * 100,
        monthlySavingCents: 1000 * 100,
      }),
    ];

    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
      },
      personalGoals: goals,
    });

    const ctx = makeCtx(data);

    // All goals remain in AppData
    expect(ctx).toBeDefined(); // Just verify context is created
    // Goals are tracked separately, not merged into mCash
  });

  // ============================================================
  // TEST 6: Personal Goals Without monthlySavingCents
  // ============================================================
  it("TEST 6: Goals without monthlySavingCents are valid", () => {
    const goal = createGoal({
      name: "Future Goal",
      monthlySavingCents: undefined, // No monthly saving
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

    // mCash should not be affected
    expect(ctx.mCash).toBe(250 * 100);
  });

  // ============================================================
  // TEST 7: Goals Preserve K_nem (Real Estate)
  // ============================================================
  it("TEST 7: Personal goals don't affect K_nem calculation", () => {
    const data: AppData = {
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
      },
      transactions: [],
      snapshots: [],
      properties: [
        {
          id: "prop-1",
          mode: "vlastne_byvanie",
          valueCents: 300_000 * 100,
          valueDate: "2026-01-01",
          mortgageBalanceCents: 200_000 * 100,
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
      personalGoals: [
        createGoal({ monthlySavingCents: 500 * 100 }),
      ],
      wasteRecords: [],
      shoppingItems: [],
    };

    const ctx = makeCtx(data);

    // K_nem = 300 000 - 200 000 = 100 000
    const expectedKNem = (300_000 - 200_000) * 100;
    expect(ctx.K_nem).toBe(expectedKNem);
  });

  // ============================================================
  // TEST 8: Empty Goals Array
  // ============================================================
  it("TEST 8: Empty personalGoals array is valid", () => {
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

    expect(ctx.mCash).toBe(350 * 100);
  });

  // ============================================================
  // TEST 9: Personal Goal Structure Validation
  // ============================================================
  it("TEST 9: PersonalGoal with all fields is valid", () => {
    const goal: PersonalGoal = {
      id: "complete-goal",
      name: "Complete Goal",
      targetCents: 20_000 * 100,
      category: "dom",
      priority: 1,
      targetYear: 2027,
      targetMonth: 6,
      flexible: true,
      monthlySavingCents: 300 * 100,
      note: "Test goal with all fields",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const data = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
      },
      personalGoals: [goal],
    });

    const ctx = makeCtx(data);
    expect(ctx).toBeDefined();
  });

  // ============================================================
  // TEST 10: FIRE Projection Stability
  // ============================================================
  it("TEST 10: FIRE projections are not affected by personal goals", () => {
    const data1 = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 500 * 100,
        savingInvCents: 1000 * 100,
      },
      personalGoals: undefined, // No goals
    });

    const data2 = createTestData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 500 * 100,
        savingInvCents: 1000 * 100,
      },
      personalGoals: [
        createGoal({ monthlySavingCents: 300 * 100 }),
        createGoal({ id: "g2", monthlySavingCents: 200 * 100 }),
      ],
    });

    const ctx1 = makeCtx(data1);
    const ctx2 = makeCtx(data2);

    // Both should have identical FIRE-related values
    expect(ctx1.mCash).toBe(ctx2.mCash);         // ✅ Cashed savings
    expect(ctx1.mInv).toBe(ctx2.mInv);           // ✅ Investment savings
    expect(ctx1.target).toBe(ctx2.target);       // ✅ FIRE target (V/p)
    expect(ctx1.K_FIRE).toBe(ctx2.K_FIRE);       // ✅ FIRE capital (K_inv + K_cash)
    expect(ctx1.K_total).toBe(ctx2.K_total);     // ✅ Total capital (K_inv + K_cash + K_nem)
    // Personal goal contributions do NOT affect FIRE projections
  });
});
