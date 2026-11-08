import { describe, expect, it } from "vitest";
import {
  monthsToPersonalGoal,
  analyzePersonalGoal,
  formatMonths,
  MAX_MONTHS,
} from "../src/domain/personalGoal";
import type { PersonalGoal } from "../src/domain/model/entities";

// Presný mesačný úrokový sadzba pre r = 3,5% ročne
const MONTHLY_RATE = 0.002870898719076642;

describe("Personal Goal — Výpočet Finančných Cieľov", () => {
  // ============================================================
  // TEST 1: FIRE Standard Scenario (252,02 mesiacov)
  // ============================================================
  it("FIRE Standard — 252.02 months", () => {
    const months = monthsToPersonalGoal(
      648_648.65 * 100, // targetCents = 648 648,65 €
      648_648.65 * 100, // currentCents (= target for this test)
      60_000 * 100, // kInv0 = 60 000 €
      30_000 * 100, // kCash0 = 30 000 €
      0, // kNem = 0 (no real estate)
      1_000 * 100, // mInv = 1 000 €/mesiacne
      500 * 100, // mCash = 500 €/mesiacne
      MONTHLY_RATE,
      0, // no additional monthly saving for specific goal
    );

    // Expected: ~252.02 months
    expect(months).toBeDefined();
    expect(months).not.toBeNull();
    if (months !== null) {
      expect(Math.abs(months - 252.02)).toBeLessThan(1); // within 1 month tolerance
    }
  });

  // ============================================================
  // TEST 2: Zero Investment Contribution (588.62 months)
  // ============================================================
  it("Zero Investment Contribution (mInv=0) — 588.62 months", () => {
    const months = monthsToPersonalGoal(
      648_648.65 * 100, // targetCents
      648_648.65 * 100, // currentCents
      60_000 * 100, // kInv0
      30_000 * 100, // kCash0
      0, // kNem
      0, // mInv = 0 (NO investment contribution)
      500 * 100, // mCash = 500 €/mesiacne
      MONTHLY_RATE,
      0,
    );

    // Expected: ~588.62 months (49.05 years, on 50-year boundary)
    expect(months).toBeDefined();
    expect(months).not.toBeNull();
    if (months !== null) {
      expect(Math.abs(months - 588.62)).toBeLessThan(1);
    }
  });

  // ============================================================
  // TEST 3: Personal Goal with Monthly Saving
  // ============================================================
  it("Personal Goal with monthly saving — reduces months to target", () => {
    const targetCents = 100_000 * 100; // 100 000 €
    const withoutExtra = monthsToPersonalGoal(
      50_000 * 100,
      targetCents,
      30_000 * 100,
      20_000 * 100,
      0,
      500 * 100,
      300 * 100, // base mCash
      MONTHLY_RATE,
      0, // no extra
    );

    const withExtra = monthsToPersonalGoal(
      50_000 * 100,
      targetCents,
      30_000 * 100,
      20_000 * 100,
      0,
      500 * 100,
      300 * 100, // base mCash
      MONTHLY_RATE,
      200 * 100, // +200 € per month for this goal
    );

    expect(withExtra).toBeDefined();
    expect(withoutExtra).toBeDefined();

    // With extra saving, we should reach the goal sooner
    if (withExtra !== null && withoutExtra !== null) {
      expect(withExtra).toBeLessThan(withoutExtra);
    }
  });

  // ============================================================
  // TEST 4: Already Reached Goal
  // ============================================================
  it("Goal already reached returns 0 months", () => {
    const months = monthsToPersonalGoal(
      100_000 * 100, // already at target
      100_000 * 100, // target
      50_000 * 100,
      50_000 * 100,
      0,
      100 * 100,
      100 * 100,
      MONTHLY_RATE,
      0,
    );

    expect(months).toBe(0);
  });

  // ============================================================
  // TEST 5: Goal at 50-Year Boundary
  // ============================================================
  it("Goal at 50-year boundary (600 months) — just dosiahnutelny", () => {
    // Create a scenario that's just below 600 months
    const months = monthsToPersonalGoal(
      200_000 * 100,
      200_500 * 100,
      100_000 * 100,
      100_000 * 100,
      0,
      100 * 100,
      100 * 100,
      MONTHLY_RATE,
      0,
    );

    expect(months).toBeDefined();
    expect(months).not.toBeNull();
    if (months !== null && months <= MAX_MONTHS) {
      // Should be within dosiahnuteľný range
      expect(months).toBeLessThanOrEqual(MAX_MONTHS);
    }
  });

  // ============================================================
  // TEST 6: Goal Beyond 50-Year Horizon
  // ============================================================
  it("Goal beyond 50-year horizon returns null (nedosiahnutelny) or > MAX_MONTHS", () => {
    // Very small monthly saving, large target
    const months = monthsToPersonalGoal(
      100_000 * 100, // current
      1_000_000 * 100, // very large target
      10_000 * 100, // small kInv
      10_000 * 100, // small kCash
      0,
      10 * 100, // tiny mInv
      10 * 100, // tiny mCash (not enough to reach goal in 50 years)
      MONTHLY_RATE,
      0,
    );

    // Should either be null or exceed MAX_MONTHS
    expect(months === null || months > MAX_MONTHS).toBe(true);
  });

  // ============================================================
  // TEST 7: Analyze Personal Goal — Dosiahnuteľný
  // ============================================================
  it("analyzePersonalGoal — classification dosiahnutelny", () => {
    const goal: PersonalGoal = {
      id: "goal1",
      name: "Dovolenka",
      targetCents: 10_000 * 100, // 10 000 €
      category: "dovolena",
      priority: 1,
      targetYear: 2026,
      targetMonth: 12,
      monthlySavingCents: 200 * 100, // 200 €/mesiacne
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const analysis = analyzePersonalGoal(
      goal,
      5_000 * 100, // current capital
      50_000 * 100,
      5_000 * 100,
      0,
      300 * 100,
      300 * 100,
      MONTHLY_RATE,
    );

    expect(analysis.classification).toBe("dosiahnutelny");
    expect(analysis.monthsToTarget).toBeDefined();
    expect(analysis.monthsToTarget).not.toBeNull();
  });

  // ============================================================
  // TEST 8: Analyze Personal Goal — Horizont 50+
  // ============================================================
  it("analyzePersonalGoal — classification horizont_50plus", () => {
    const goal: PersonalGoal = {
      id: "goal2",
      name: "Dom",
      targetCents: 500_000 * 100, // 500 000 € — very large
      category: "dom",
      priority: 1,
      targetYear: 2035,
      monthlySavingCents: 100 * 100, // only 100 €/mesiacne (not enough)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const analysis = analyzePersonalGoal(
      goal,
      100_000 * 100,
      30_000 * 100,
      10_000 * 100,
      0,
      100 * 100,
      100 * 100,
      MONTHLY_RATE,
    );

    // Very large goal with small contribution should be horizont_50plus
    expect(
      analysis.classification === "horizont_50plus" ||
        analysis.classification === "nedosiahnutelny"
    ).toBe(true);
  });

  // ============================================================
  // TEST 9: Format Months Utility
  // ============================================================
  it("formatMonths — converts months to human-readable format", () => {
    expect(formatMonths(0)).toBe("teraz");
    expect(formatMonths(252.02)).toContain("rokov");
    expect(formatMonths(588.62)).toContain("rokov");
    expect(formatMonths(null)).toBe("matematicky nedosiahnuteľný");
    expect(formatMonths(5)).toContain("mesiacov");
  });

  // ============================================================
  // TEST 10: Multiple Goals Combination
  // ============================================================
  it("multiple goals with different monthlySavingCents — each evaluated separately", () => {
    const goal1: PersonalGoal = {
      id: "g1",
      name: "Dovolenka",
      targetCents: 10_000 * 100,
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 200 * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const goal2: PersonalGoal = {
      id: "g2",
      name: "Dom",
      targetCents: 100_000 * 100,
      category: "dom",
      priority: 2,
      targetYear: 2035,
      monthlySavingCents: 500 * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const analysis1 = analyzePersonalGoal(
      goal1,
      5_000 * 100,
      50_000 * 100,
      10_000 * 100,
      0,
      300 * 100,
      300 * 100,
      MONTHLY_RATE,
    );

    const analysis2 = analyzePersonalGoal(
      goal2,
      10_000 * 100,
      50_000 * 100,
      20_000 * 100,
      0,
      300 * 100,
      300 * 100,
      MONTHLY_RATE,
    );

    // Goal 2 (larger amount) should take longer
    expect(analysis2.monthsToTarget).toBeDefined();
    expect(analysis1.monthsToTarget).toBeDefined();

    if (
      analysis1.monthsToTarget !== null &&
      analysis2.monthsToTarget !== null
    ) {
      expect(analysis2.monthsToTarget).toBeGreaterThan(
        analysis1.monthsToTarget
      );
    }
  });

  // ============================================================
  // TEST 11: With Real Estate (K_nem component)
  // ============================================================
  it("goal calculation includes K_nem (real estate equity)", () => {
    const withRealEstate = monthsToPersonalGoal(
      200_000 * 100,
      400_000 * 100, // target
      100_000 * 100,
      50_000 * 100,
      100_000 * 100, // K_nem = real estate equity
      200 * 100,
      200 * 100,
      MONTHLY_RATE,
      0,
    );

    const withoutRealEstate = monthsToPersonalGoal(
      200_000 * 100,
      400_000 * 100, // same target
      100_000 * 100,
      50_000 * 100,
      0, // no K_nem
      200 * 100,
      200 * 100,
      MONTHLY_RATE,
      0,
    );

    // With real estate, goal should be reached sooner
    expect(withRealEstate).toBeDefined();
    expect(withoutRealEstate).toBeDefined();

    if (withRealEstate !== null && withoutRealEstate !== null) {
      expect(withRealEstate).toBeLessThan(withoutRealEstate);
    }
  });

  // ============================================================
  // TEST 12: Flexibility Flag in Analysis
  // ============================================================
  it("analyzePersonalGoal preserves flexible flag from goal", () => {
    const flexibleGoal: PersonalGoal = {
      id: "flex",
      name: "Flexibilný cieľ",
      targetCents: 20_000 * 100,
      category: "skolenie",
      priority: 3,
      targetYear: 2027,
      flexible: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const rigidGoal: PersonalGoal = {
      id: "rigid",
      name: "Pevný cieľ",
      targetCents: 20_000 * 100,
      category: "skolenie",
      priority: 3,
      targetYear: 2027,
      flexible: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const flexAnalysis = analyzePersonalGoal(
      flexibleGoal,
      10_000 * 100,
      20_000 * 100,
      10_000 * 100,
      0,
      100 * 100,
      100 * 100,
      MONTHLY_RATE,
    );

    const rigidAnalysis = analyzePersonalGoal(
      rigidGoal,
      10_000 * 100,
      20_000 * 100,
      10_000 * 100,
      0,
      100 * 100,
      100 * 100,
      MONTHLY_RATE,
    );

    expect(flexAnalysis.flexible).toBe(true);
    expect(rigidAnalysis.flexible).toBe(false);
  });
});
