import { describe, expect, it } from "vitest";
import { makeCtx } from "../src/domain/context";
import { monthsToPersonalGoal, analyzePersonalGoal, formatMonths } from "../src/domain/personalGoal";
import type { AppData, PersonalGoal, Settings, Snapshot } from "../src/storage/types";

/**
 * Fáza 4 — Integračné Overenie (Integration Verification)
 * Overuje vzájomnú kompatibilitu všetkých modulov:
 * - Dátový model (entities.ts, PersonalGoal)
 * - Výpočty (personalGoal.ts, monthsToPersonalGoal)
 * - Kontext (context.ts, integrovaný mCash)
 * - UI analýza (analyzePersonalGoal)
 * - Spracovanie chybí a okrajových prípadov
 */

function createCompleteAppData(args: {
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

describe("Fáza 4 — Integračné Overenie (Phase 4 Integration Verification)", () => {
  // ============================================================
  // TEST 1: End-to-End Flow — Data Model → Computation → Analysis
  // ============================================================
  it("TEST 1: Complete flow from PersonalGoal to analysis and UI", () => {
    const goal: PersonalGoal = {
      id: "test-goal",
      name: "Dovolenka",
      targetCents: 5000 * 100,
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      targetMonth: 6,
      flexible: false,
      monthlySavingCents: 200 * 100,
      note: "Test goal",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const data = createCompleteAppData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 300 * 100,
      },
      personalGoals: [goal],
    });

    // Step 1: Context calculation includes goal in mCash
    const ctx = makeCtx(data);
    expect(ctx.mCash).toBe(500 * 100); // 300 base + 200 from goal

    // Step 2: Direct computation using context values
    const months = monthsToPersonalGoal(
      goal.targetCents,
      goal.targetCents,
      ctx.K_inv,
      ctx.K_cash,
      ctx.K_nem,
      ctx.mInv,
      ctx.mCash - (goal.monthlySavingCents ?? 0), // mCash without the goal contribution
      0.002870898719076642, // monthly rate for 3.5%
      goal.monthlySavingCents ?? 0,
    );

    expect(months).toBeDefined();
    expect(typeof months === "number" || months === null).toBe(true);

    // Step 3: Analysis classification
    const analysis = analyzePersonalGoal(
      goal,
      goal.targetCents,
      ctx.K_inv,
      ctx.K_cash,
      ctx.K_nem,
      ctx.mInv,
      ctx.mCash - (goal.monthlySavingCents ?? 0),
      0.002870898719076642,
    );

    expect(analysis.goal.id).toBe(goal.id);
    expect(analysis.classification).toMatch(/dosiahnutelny|horizont_50plus|nedosiahnutelny/);
    expect(typeof analysis.monthsToTarget === "number" || analysis.monthsToTarget === null).toBe(true);

    // Step 4: UI formatting
    const formatted = formatMonths(analysis.monthsToTarget);
    expect(typeof formatted).toBe("string");
    expect(formatted.length).toBeGreaterThan(0);
  });

  // ============================================================
  // TEST 2: Multiple Goals — Cumulative mCash Impact
  // ============================================================
  it("TEST 2: Multiple goals accumulate in mCash", () => {
    const goals: PersonalGoal[] = [
      {
        id: "g1",
        name: "Dovolenka",
        targetCents: 3000 * 100,
        category: "dovolena",
        priority: 1,
        targetYear: 2027,
        monthlySavingCents: 100 * 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "g2",
        name: "Školenie",
        targetCents: 5000 * 100,
        category: "skolenie",
        priority: 2,
        targetYear: 2028,
        monthlySavingCents: 150 * 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "g3",
        name: "Dom",
        targetCents: 100_000 * 100,
        category: "dom",
        priority: 3,
        targetYear: 2030,
        monthlySavingCents: 300 * 100,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const data = createCompleteAppData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 200 * 100,
      },
      personalGoals: goals,
    });

    const ctx = makeCtx(data);
    const expectedMCash = 200 * 100 + 100 * 100 + 150 * 100 + 300 * 100;
    expect(ctx.mCash).toBe(expectedMCash);

    // All goals should be analyzable independently
    goals.forEach((goal) => {
      const analysis = analyzePersonalGoal(
        goal,
        goal.targetCents,
        ctx.K_inv,
        ctx.K_cash,
        ctx.K_nem,
        ctx.mInv,
        ctx.mCash - (goal.monthlySavingCents ?? 0),
        0.002870898719076642,
      );
      expect(analysis).toBeDefined();
    });
  });

  // ============================================================
  // TEST 3: Backward Compatibility — Missing personalGoals
  // ============================================================
  it("TEST 3: Systems work without personalGoals (backward compatible)", () => {
    const data = createCompleteAppData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 250 * 100,
      },
      // No personalGoals property at all
    });

    const ctx = makeCtx(data);
    expect(ctx.mCash).toBe(250 * 100);
    expect(ctx.K_FIRE).toBeDefined();
    expect(ctx.K_total).toBeDefined();
  });

  // ============================================================
  // TEST 4: Capital Preservation — Goals Don't Affect Historical Data
  // ============================================================
  it("TEST 4: Goals increase mCash but don't affect K_inv, K_nem, K_FIRE", () => {
    const snap: Snapshot = {
      id: "snap-1",
      date: "2026-01-01",
      investmentsCents: 100_000 * 100,
      cashCents: 50_000 * 100,
      createdAt: "2026-01-01T00:00:00Z",
    };

    const goal: PersonalGoal = {
      id: "g",
      name: "Goal",
      targetCents: 10_000 * 100,
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 500 * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const data = createCompleteAppData({
      settings: {
        expensesCents: 100_000 * 100,
        withdrawalRate: 0.04,
        realReturn: 0.035,
        reserveCents: 50_000 * 100,
        thresholdCents: 1_000 * 100,
        savingCashCents: 200 * 100,
      },
      snapshots: [snap],
      personalGoals: [goal],
    });

    const ctx = makeCtx(data);

    // Historical capital unchanged
    expect(ctx.K_inv).toBe(100_000 * 100);
    expect(ctx.K_FIRE).toBe(100_000 * 100 + 50_000 * 100);

    // But mCash increased for future calculations
    expect(ctx.mCash).toBe(200 * 100 + 500 * 100);
  });

  // ============================================================
  // TEST 5: Extreme Values — Large Goals, High Contributions
  // ============================================================
  it("TEST 5: System handles extreme values correctly", () => {
    const goal: PersonalGoal = {
      id: "extreme",
      name: "Million Euro Goal",
      targetCents: 1_000_000 * 100,
      category: "dom",
      priority: 1,
      targetYear: 2050,
      monthlySavingCents: 50_000 * 100, // 50k/month
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const data = createCompleteAppData({
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
    expect(ctx.mCash).toBeGreaterThan(0);

    const analysis = analyzePersonalGoal(
      goal,
      goal.targetCents,
      ctx.K_inv,
      ctx.K_cash,
      ctx.K_nem,
      ctx.mInv,
      ctx.mCash - (goal.monthlySavingCents ?? 0),
      0.002870898719076642,
    );

    expect(analysis).toBeDefined();
    expect(analysis.classification).toMatch(/dosiahnutelny|horizont_50plus|nedosiahnutelny/);
  });

  // ============================================================
  // TEST 6: Type Safety — Proper TypeScript Interface Compliance
  // ============================================================
  it("TEST 6: PersonalGoal instances comply with interface", () => {
    const goal: PersonalGoal = {
      id: "type-test",
      name: "Type Test",
      targetCents: 5000 * 100,
      category: "dovolena", // matches PersonalGoalCategory
      priority: 1,
      targetYear: 2027,
      targetMonth: 12, // optional, so can be undefined
      flexible: true, // optional
      monthlySavingCents: 200 * 100, // optional
      note: "Testing types",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Should not throw
    const data = createCompleteAppData({ personalGoals: [goal] });
    const ctx = makeCtx(data);
    expect(ctx).toBeDefined();
  });

  // ============================================================
  // TEST 7: Consistency Across Phases
  // ============================================================
  it("TEST 7: All phases produce consistent results", () => {
    const goal: PersonalGoal = {
      id: "consistency",
      name: "Consistency Check",
      targetCents: 20_000 * 100,
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 300 * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const data = createCompleteAppData({
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

    // Phase 1: Model (goal defined)
    expect(goal.targetCents).toBe(20_000 * 100);

    // Phase 2: Context integration
    const ctx = makeCtx(data);
    expect(ctx.mCash).toBe(250 * 100 + 300 * 100);

    // Phase 3: UI analysis
    const analysis = analyzePersonalGoal(
      goal,
      goal.targetCents,
      ctx.K_inv,
      ctx.K_cash,
      ctx.K_nem,
      ctx.mInv,
      ctx.mCash - 300 * 100,
      0.002870898719076642,
    );

    expect(analysis.goal.id).toBe(goal.id);
    expect(analysis.monthlyAdditionCents).toBe(300 * 100);

    // Phase 4: Format for display
    const formatted = formatMonths(analysis.monthsToTarget);
    expect(typeof formatted).toBe("string");
  });
});
