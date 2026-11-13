import { describe, expect, it } from "vitest";
import { analyzePersonalGoal, monthsToPersonalGoal } from "../src/domain/personalGoal";
import type { PersonalGoal } from "../src/domain/model/entities";

describe("Backward Compatibility — Starý Záznam Bez K0", () => {
  it("Starý záznam bez currentCapitalCents sa analyzuje s K0=0", () => {
    // Simulácia starého záznamu bez K0 (bez currentCapitalCents)
    const oldGoal: Omit<PersonalGoal, "currentCapitalCents"> & { currentCapitalCents?: number } = {
      id: "old-goal-1",
      name: "Dovolenka",
      targetCents: 10000 * 100, // 10000 €
      // currentCapitalCents CHÝBA - starý záznam
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 200 * 100, // 200 €
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // analyzePersonalGoal by mala loadnúť starý záznam bez K0 a defaultovať K0 na 0
    const analysis = analyzePersonalGoal(oldGoal as PersonalGoal);

    expect(analysis.currentCents).toBe(0); // K0 = 0 (default)
    expect(analysis.monthsToTarget).toBe(50); // (10000 - 0) / 200 = 50 mesiacov
    expect(analysis.classification).toBe("dosiahnutelny");
  });

  it("Starý záznam bez K0 — po úprave s novým K0 sa správne uloží a načíta", () => {
    // Krok 1: Starý záznam bez K0
    const oldGoal: PersonalGoal = {
      id: "old-goal-2",
      name: "Dom",
      targetCents: 100000 * 100, // 100000 €
      // currentCapitalCents undefined (starý záznam)
      category: "dom",
      priority: 1,
      targetYear: 2030,
      monthlySavingCents: 1000 * 100, // 1000 €
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Krok 2: Analýza staého záznamu
    const analysis1 = analyzePersonalGoal(oldGoal);
    expect(analysis1.monthsToTarget).toBe(100); // (100000 - 0) / 1000 = 100

    // Krok 3: Užívateľ úpraví cieľ a pridá K0 = 20000 €
    const modifiedGoal: PersonalGoal = {
      ...oldGoal,
      currentCapitalCents: 20000 * 100,
      updatedAt: new Date().toISOString(),
    };

    // Krok 4: Analýza upraveneho záznamu
    const analysis2 = analyzePersonalGoal(modifiedGoal);
    expect(analysis2.currentCents).toBe(20000 * 100);
    expect(analysis2.monthsToTarget).toBe(80); // (100000 - 20000) / 1000 = 80
  });

  it("Výpočet s centami — K0=2000.50 €, T=10000.00 €, mG=200.00 €", () => {
    const goal: PersonalGoal = {
      id: "cents-goal",
      name: "Dovolenka s centami",
      targetCents: 10000 * 100 + 0, // 10000.00 €
      currentCapitalCents: 2000 * 100 + 50, // 2000.50 €
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 200 * 100, // 200.00 €
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const analysis = analyzePersonalGoal(goal);
    // n = ⌈(1000000 - 200050) / 20000⌉ = ⌈799950 / 20000⌉ = ⌈39.9975⌉ = 40
    expect(analysis.monthsToTarget).toBe(40);
  });

  it("K0 > T — cieľ je už dosiahnutý", () => {
    const months = monthsToPersonalGoal(
      12000 * 100, // K0 = 12000 € (viac ako cieľ)
      10000 * 100, // T = 10000 €
      200 * 100,
    );
    expect(months).toBe(0);
  });

  it("K0 = T — cieľ je dosiahnutý", () => {
    const months = monthsToPersonalGoal(
      10000 * 100,
      10000 * 100,
      200 * 100,
    );
    expect(months).toBe(0);
  });

  it("K0 < T, mG = 0 — nedosiahnuteľný", () => {
    const months = monthsToPersonalGoal(
      5000 * 100, // K0 = 5000 €
      10000 * 100, // T = 10000 €
      0, // mG = 0 (bez príspevku)
    );
    expect(months).toBeNull();
  });
});
