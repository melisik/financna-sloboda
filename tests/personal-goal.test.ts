import { describe, it, expect } from "vitest";
import {
  monthsToPersonalGoalWithStatus,
  monthsToPersonalGoal,
  validatePersonalGoalDate,
  LONG_HORIZON_MONTHS,
} from "../src/domain/personalGoal";

describe("BLOK 4: Individuálne Finančné Ciele", () => {
  describe("monthsToPersonalGoalWithStatus — 8 Testov s Numerickými Prípadmi", () => {
    // T1: K0=2000, T=5000, mGoal=250 → n=12 mesiacov
    it("T1: Základný výpočet — 12 mesiacov", () => {
      const result = monthsToPersonalGoalWithStatus(5000 * 100, 2000 * 100, 250 * 100);
      expect(result.status).toBe("feasible");
      expect(result.months).toBe(12);
      expect(result.targetDate).not.toBeNull();
      expect(result.reason).toContain("12 mesiacov");
    });

    // T2: K0=5000, T=5000 → achieved
    it("T2: Cieľ je dosiahnutý (K0 = T)", () => {
      const result = monthsToPersonalGoalWithStatus(5000 * 100, 5000 * 100, 500 * 100);
      expect(result.status).toBe("achieved");
      expect(result.months).toBe(0);
      expect(result.targetDate).not.toBeNull();
      expect(result.reason).toContain("Cieľ je dosiahnutý");
    });

    // T3: K0=6000, T=5000 → achieved
    it("T3: Cieľ je už prekročený (K0 > T)", () => {
      const result = monthsToPersonalGoalWithStatus(5000 * 100, 6000 * 100, 500 * 100);
      expect(result.status).toBe("achieved");
      expect(result.months).toBe(0);
    });

    // T4: K0=2000, T=5000, mGoal=0 → impossible
    it("T4: Bez príspevku — nedosiahnuteľný", () => {
      const result = monthsToPersonalGoalWithStatus(5000 * 100, 2000 * 100, 0);
      expect(result.status).toBe("impossible");
      expect(result.months).toBeNull();
      expect(result.reason).toContain("Pri aktuálnom mesačnom príspevku");
    });

    // T5: K0=2000, T=5000, mGoal=-100 → impossible
    it("T5: Záporný príspevek — nedosiahnuteľný", () => {
      const result = monthsToPersonalGoalWithStatus(5000 * 100, 2000 * 100, -100 * 100);
      expect(result.status).toBe("impossible");
      expect(result.months).toBeNull();
      expect(result.reason).toContain("Pri aktuálnom mesačnom príspevku");
    });

    // T6: K0=0, T=1000000, mGoal=100 → n=10000 → long_horizon
    it("T6: Veľký horizont — long_horizon", () => {
      const result = monthsToPersonalGoalWithStatus(1000000 * 100, 0, 100 * 100);
      expect(result.status).toBe("long_horizon");
      expect(result.months).toBe(10000);
      expect(result.targetDate).toBeNull(); // Príliš vzdialený
      expect(result.reason).toContain("Cieľ za viac ako 100 rokov");
    });

    // T7: Presne 1200 mesiacov → feasible
    it("T7: Presne na hranici (n=1200) → feasible", () => {
      const result = monthsToPersonalGoalWithStatus(
        1200000 * 100,
        0,
        1000 * 100
      );
      expect(result.status).toBe("feasible");
      expect(result.months).toBe(1200);
      expect(result.targetDate).not.toBeNull();
    });

    // T8: Presne 1201 mesiacov → long_horizon
    it("T8: Tesne nad hranicou (n=1201) → long_horizon", () => {
      const result = monthsToPersonalGoalWithStatus(
        1201000 * 100,
        0,
        1000 * 100
      );
      expect(result.status).toBe("long_horizon");
      expect(result.months).toBe(1201);
      expect(result.targetDate).toBeNull();
    });
  });

  describe("monthsToPersonalGoal — Stará Verzia (Compatibility)", () => {
    it("Lineárny výpočet", () => {
      const months = monthsToPersonalGoal(2000 * 100, 5000 * 100, 250 * 100);
      expect(months).toBe(12);
    });

    it("K0 >= T → 0 mesiacov", () => {
      const months = monthsToPersonalGoal(6000 * 100, 5000 * 100, 500 * 100);
      expect(months).toBe(0);
    });

    it("mGoal = 0 → null", () => {
      const months = monthsToPersonalGoal(2000 * 100, 5000 * 100, 0);
      expect(months).toBeNull();
    });
  });

  describe("validatePersonalGoalDate", () => {
    it("Rok v minulosti → invalid", () => {
      const currentYear = new Date().getFullYear();
      const result = validatePersonalGoalDate(currentYear - 1, 6);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain("minulosti");
    });

    it("Mesiac v minulosti → invalid", () => {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      if (currentMonth > 1) {
        const result = validatePersonalGoalDate(currentYear, currentMonth - 1);
        expect(result.valid).toBe(false);
      }
    });

    it("Budúci rok → valid", () => {
      const currentYear = new Date().getFullYear();
      const result = validatePersonalGoalDate(currentYear + 1, 6);
      expect(result.valid).toBe(true);
    });
  });

  describe("Hranice a Edge Cases", () => {
    it("K0 a T sú undefined → invalid", () => {
      const result = monthsToPersonalGoalWithStatus(undefined, undefined, 500 * 100);
      expect(result.status).toBe("invalid");
      expect(result.months).toBeNull();
    });

    it("mGoal je undefined → treated as 0 → impossible", () => {
      const result = monthsToPersonalGoalWithStatus(5000 * 100, 2000 * 100, undefined);
      expect(result.status).toBe("impossible");
    });

    it("Presný LONG_HORIZON_MONTHS", () => {
      expect(LONG_HORIZON_MONTHS).toBe(1200);
    });
  });
});
