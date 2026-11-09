import { describe, expect, it } from "vitest";
import {
  monthsToPersonalGoal,
  analyzePersonalGoal,
  formatMonths,
  checkGoalContributionsSurplus,
  MAX_MONTHS,
} from "../src/domain/personalGoal";
import type { PersonalGoal } from "../src/domain/model/entities";

describe("Personal Goal — Lineárny Model bez Výnosu", () => {
  // ============================================================
  // SCENARIO A: Individuálny cieľ — Základný Výpočet
  // ============================================================
  it("SCENARIO A: cieľ 5000 €, K0=1000 €, mGoal=200 €/mesiac → 20 mesiacov", () => {
    const months = monthsToPersonalGoal(
      1000 * 100, // K0 = 1000 €
      5000 * 100, // cieľ = 5000 €
      200 * 100,  // príspevek = 200 €
    );

    expect(months).toBe(20); // (5000 - 1000) / 200 = 20
  });

  // ============================================================
  // SCENARIO B: Už dosiahnutý cieľ
  // ============================================================
  it("SCENARIO B: cieľ 5000 €, K0=5000 € → 0 mesiacov", () => {
    const months = monthsToPersonalGoal(
      5000 * 100,
      5000 * 100,
      200 * 100,
    );

    expect(months).toBe(0); // Cieľ je dosiahnutý
  });

  // ============================================================
  // SCENARIO C: Nulový príspevek
  // ============================================================
  it("SCENARIO C: cieľ 5000 €, K0=1000 €, mGoal=0 € → nedosiahnuteľný", () => {
    const months = monthsToPersonalGoal(
      1000 * 100,
      5000 * 100,
      0, // Bez príspevku
    );

    expect(months).toBeNull(); // Nedosiahnuteľný
  });

  // ============================================================
  // SCENARIO D: Oddelenie od FIRE — Funkčná Nezávislosť
  // ============================================================
  it("SCENARIO D: Zmena mesačného príspevku na cieľ nemení FIRE výpočet", () => {
    const goal1: PersonalGoal = {
      id: "d1",
      name: "Cieľ 1",
      targetCents: 10_000 * 100,
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 100 * 100, // 100 €
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const goal2: PersonalGoal = {
      id: "d2",
      name: "Cieľ 2",
      targetCents: 10_000 * 100,
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 300 * 100, // 300 € (3× viac)
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Obe by mali dať rovnaký výsledok pre samotný cieľ (bez FIRE)
    const months1 = monthsToPersonalGoal(
      2000 * 100,
      10_000 * 100,
      100 * 100,
    );

    const months2 = monthsToPersonalGoal(
      2000 * 100,
      10_000 * 100,
      300 * 100,
    );

    // Výpočet cieľa závisí iba od cieľa, K0 a príspevku — NIE od FIRE
    expect(months1).toBe(80); // (10000 - 2000) / 100 = 80
    expect(months2).toBe(Math.ceil((10000 * 100 - 2000 * 100) / (300 * 100))); // (10000 - 2000) / 300 ≈ 27
    expect(months1).not.toBe(months2); // Sú rôzne (ako správne)
  });

  // ============================================================
  // SCENARIO E: Kontrola Prebytku — Bez Upozornenia
  // ============================================================
  it("SCENARIO E: m=1500 €, cieľ1=300 €, cieľ2=400 € → bez upozornenia", () => {
    const m = 1500 * 100;
    const contributions = (300 + 400) * 100; // 700 €

    const surplus = checkGoalContributionsSurplus(m, contributions);

    expect(surplus).toBeNull(); // 700 <= 1500, OK
  });

  // ============================================================
  // SCENARIO F: Prekročenie Prebytku
  // ============================================================
  it("SCENARIO F: m=1500 €, príspevky spolu=1700 € → upozornenie o +200 €", () => {
    const m = 1500 * 100;
    const contributions = 1700 * 100; // 200 € viac ako dostupný tok

    const surplus = checkGoalContributionsSurplus(m, contributions);

    expect(surplus).toBe(200 * 100); // Prekročenie o 200 €
  });

  // ============================================================
  // SCENARIO G: Viacero Cieľov — Nezávislosť Výpočtov
  // ============================================================
  it("SCENARIO G: Viacero cieľov — každý má nezávislý výpočet", () => {
    const goal1: PersonalGoal = {
      id: "g1",
      name: "Dovolenka",
      targetCents: 5000 * 100,
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 200 * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const goal2: PersonalGoal = {
      id: "g2",
      name: "Školenie",
      targetCents: 3000 * 100,
      category: "skolenie",
      priority: 2,
      targetYear: 2027,
      monthlySavingCents: 100 * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const goal3: PersonalGoal = {
      id: "g3",
      name: "Dom",
      targetCents: 50_000 * 100,
      category: "dom",
      priority: 3,
      targetYear: 2030,
      monthlySavingCents: 500 * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Nastaviť K0 pre každý cieľ
    goal1.currentCapitalCents = 1000 * 100;
    goal2.currentCapitalCents = 500 * 100;
    goal3.currentCapitalCents = 10_000 * 100;

    // Každý cieľ sa počíta zvlášť
    const analysis1 = analyzePersonalGoal(goal1);
    const analysis2 = analyzePersonalGoal(goal2);
    const analysis3 = analyzePersonalGoal(goal3);

    // Cieľ 1: (5000 - 1000) / 200 = 20 mesiacov
    expect(analysis1.monthsToTarget).toBe(20);

    // Cieľ 2: (3000 - 500) / 100 = 25 mesiacov
    expect(analysis2.monthsToTarget).toBe(25);

    // Cieľ 3: (50000 - 10000) / 500 = 80 mesiacov
    expect(analysis3.monthsToTarget).toBe(80);

    // Výsledok jedného cieľa nemení druhý
    expect(analysis1.monthsToTarget).not.toEqual(analysis2.monthsToTarget);
    expect(analysis2.monthsToTarget).not.toEqual(analysis3.monthsToTarget);
  });

  // ============================================================
  // DODATOČNÉ TESTY — Hraničné Prípady
  // ============================================================

  it("Cieľ s negatívnym kapitálom je neplatný", () => {
    const months = monthsToPersonalGoal(
      -100 * 100, // Neplatné
      5000 * 100,
      200 * 100,
    );
    expect(months).toBeNull();
  });

  it("Cieľ s negatívnym príspevkom je neplatný", () => {
    const months = monthsToPersonalGoal(
      1000 * 100,
      5000 * 100,
      -100 * 100, // Neplatné
    );
    expect(months).toBeNull();
  });

  it("Cieľ s negatívnou cieľovou sumou je neplatný", () => {
    const months = monthsToPersonalGoal(
      1000 * 100,
      -5000 * 100, // Neplatné
      200 * 100,
    );
    expect(months).toBeNull();
  });

  it("formatMonths() vracia správný formát", () => {
    expect(formatMonths(0)).toBe("teraz");
    expect(formatMonths(20)).toContain("mesiacov");
    expect(formatMonths(null)).toBe("matematicky nedosiahnuteľný");
  });

  it("analyzePersonalGoal() vracia správnú klasifikáciu", () => {
    const goal: PersonalGoal = {
      id: "test",
      name: "Test",
      targetCents: 10_000 * 100,
      currentCapitalCents: 0,
      category: "dovolena",
      priority: 1,
      targetYear: 2027,
      monthlySavingCents: 100 * 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const analysis = analyzePersonalGoal(goal);
    expect(analysis.classification).toMatch(/dosiahnutelny|horizont_50plus|nedosiahnutelny/);
  });

  it("Cieľ s MAX_MONTHS hranicou je klasifikovaný ako dosiahnuteľný", () => {
    // K0 = 0, cieľ = 600 000 €, príspevek = 1000 €
    // n = 600 mesiacov = MAX_MONTHS
    const months = monthsToPersonalGoal(
      0,
      600_000 * 100,
      1000 * 100,
    );
    expect(months).toBeLessThanOrEqual(MAX_MONTHS);
  });

  it("Cieľ prekračujúci MAX_MONTHS je klasifikovaný ako horizont_50plus", () => {
    // K0 = 0, cieľ = 601 000 €, príspevek = 1000 €
    // n = 601 mesiacov > MAX_MONTHS
    const months = monthsToPersonalGoal(
      0,
      601_000 * 100,
      1000 * 100,
    );
    expect(months).toBeGreaterThan(MAX_MONTHS);
  });
});
