import { describe, it, expect } from "vitest";
import { evaluateMilestones, type Milestone } from "../src/domain/milestones";

describe("D344 - Milestones", () => {
  describe("Scenár 1: Kapitál pod hranicou prvého míľnika", () => {
    it("first_1k je unreached keď capital < 100_000", () => {
      const capital = 50_000; // 500 EUR
      const milestones = evaluateMilestones(capital, 0, 0);

      const first_1k = milestones.find(m => m.id === "first_1k");
      expect(first_1k?.reached).toBe(false);
    });

    it("all milestones sú unreached keď capital = 0", () => {
      const milestones = evaluateMilestones(0, 0, 0);
      expect(milestones.every(m => !m.reached)).toBe(true);
    });
  });

  describe("Scenár 2: Kapitál presne na hranici 1 000 EUR", () => {
    it("first_1k je reached keď capital = 100_000 (1 000 EUR)", () => {
      const capital = 100_000; // presne 1 000 EUR
      const milestones = evaluateMilestones(capital, 0, 0);

      const first_1k = milestones.find(m => m.id === "first_1k");
      expect(first_1k?.reached).toBe(true);
    });

    it("first_10k je unreached keď capital = 100_000", () => {
      const capital = 100_000;
      const milestones = evaluateMilestones(capital, 0, 0);

      const first_10k = milestones.find(m => m.id === "first_10k");
      expect(first_10k?.reached).toBe(false);
    });
  });

  describe("Scenár 3: Kapitál presne na hranici 10 000 EUR", () => {
    it("first_10k je reached keď capital = 1_000_000 (10 000 EUR)", () => {
      const capital = 1_000_000; // presne 10 000 EUR
      const milestones = evaluateMilestones(capital, 0, 0);

      const first_10k = milestones.find(m => m.id === "first_10k");
      expect(first_10k?.reached).toBe(true);
    });

    it("first_1k je tiež reached keď capital = 1_000_000", () => {
      const capital = 1_000_000;
      const milestones = evaluateMilestones(capital, 0, 0);

      const first_1k = milestones.find(m => m.id === "first_1k");
      expect(first_1k?.reached).toBe(true);
    });
  });

  describe("Scenár 4: Dosiahnutie polovice cieľa (halfway_there)", () => {
    it("halfway_there je unreached keď capital < target / 2", () => {
      const target = 1_000_000; // 10 000 EUR
      const capital = 400_000; // 4 000 EUR (menej ako 5 000)
      const milestones = evaluateMilestones(capital, target, 0);

      const halfway = milestones.find(m => m.id === "halfway_there");
      expect(halfway?.reached).toBe(false);
    });

    it("halfway_there je reached keď capital = target / 2", () => {
      const target = 1_000_000; // 10 000 EUR
      const capital = 500_000; // 5 000 EUR (presne polovica)
      const milestones = evaluateMilestones(capital, target, 0);

      const halfway = milestones.find(m => m.id === "halfway_there");
      expect(halfway?.reached).toBe(true);
    });

    it("halfway_there je reached keď capital > target / 2", () => {
      const target = 1_000_000;
      const capital = 750_000; // 7 500 EUR
      const milestones = evaluateMilestones(capital, target, 0);

      const halfway = milestones.find(m => m.id === "halfway_there");
      expect(halfway?.reached).toBe(true);
    });

    it("halfway_there je unreached keď target = 0 (delenie nulou)", () => {
      const capital = 500_000;
      const target = 0;
      const milestones = evaluateMilestones(capital, target, 0);

      const halfway = milestones.find(m => m.id === "halfway_there");
      expect(halfway?.reached).toBe(false); // targetCents > 0 podmienka blokuje
    });
  });

  describe("Scenár 5: Pokrytie týždenných výdavkov (expenses_covered_1w)", () => {
    it("expenses_covered_1w je unreached keď capital < weeklyExpenses", () => {
      const capital = 50_000; // 500 EUR
      const weeklyExpenses = 100_000; // 1 000 EUR za týždeň
      const milestones = evaluateMilestones(capital, 0, weeklyExpenses);

      const weekly = milestones.find(m => m.id === "expenses_covered_1w");
      expect(weekly?.reached).toBe(false);
    });

    it("expenses_covered_1w je reached keď capital = weeklyExpenses", () => {
      const weeklyExpenses = 100_000; // 1 000 EUR za týždeň
      const capital = 100_000; // presne to isté
      const milestones = evaluateMilestones(capital, 0, weeklyExpenses);

      const weekly = milestones.find(m => m.id === "expenses_covered_1w");
      expect(weekly?.reached).toBe(true);
    });

    it("expenses_covered_1w je reached keď capital > weeklyExpenses", () => {
      const weeklyExpenses = 100_000;
      const capital = 200_000; // 2x týždenné výdavky
      const milestones = evaluateMilestones(capital, 0, weeklyExpenses);

      const weekly = milestones.find(m => m.id === "expenses_covered_1w");
      expect(weekly?.reached).toBe(true);
    });

    it("expenses_covered_1w je unreached keď weeklyExpenses = 0", () => {
      const capital = 500_000;
      const weeklyExpenses = 0;
      const milestones = evaluateMilestones(capital, 0, weeklyExpenses);

      const weekly = milestones.find(m => m.id === "expenses_covered_1w");
      expect(weekly?.reached).toBe(false); // weeklyExpensesCents > 0 podmienka blokuje
    });
  });

  describe("Scenár 6: Kapitál nad jednotlivými hranicami", () => {
    it("všetky milestones sú reached keď capital je veľmi vysoký", () => {
      const capital = 5_000_000; // 50 000 EUR
      const target = 3_000_000; // 30 000 EUR
      const weeklyExpenses = 50_000; // 500 EUR
      const milestones = evaluateMilestones(capital, target, weeklyExpenses);

      expect(milestones.every(m => m.reached)).toBe(true);
    });

    it("vracia všetky 4 míľniky v správnom poradí", () => {
      const capital = 100_000;
      const milestones = evaluateMilestones(capital, 0, 0);

      expect(milestones).toHaveLength(4);
      expect(milestones[0].id).toBe("first_1k");
      expect(milestones[1].id).toBe("first_10k");
      expect(milestones[2].id).toBe("halfway_there");
      expect(milestones[3].id).toBe("expenses_covered_1w");
    });
  });

  describe("Scenár 7: Nulový cieľ (target = 0)", () => {
    it("halfway_there je vždy unreached keď target = 0", () => {
      const capital = 500_000;
      const target = 0;
      const milestones = evaluateMilestones(capital, target, 0);

      const halfway = milestones.find(m => m.id === "halfway_there");
      expect(halfway?.reached).toBe(false);
    });

    it("ostatné míľniky sa vyhodnocujú normálne aj keď target = 0", () => {
      const capital = 1_000_000; // dosť veľko pre first_1k a first_10k
      const target = 0;
      const milestones = evaluateMilestones(capital, target, 0);

      const first_1k = milestones.find(m => m.id === "first_1k");
      const first_10k = milestones.find(m => m.id === "first_10k");

      expect(first_1k?.reached).toBe(true);
      expect(first_10k?.reached).toBe(true);
    });
  });

  describe("Scenár 8: Nulový kapitál (capital = 0)", () => {
    it("všetky míľniky sú unreached keď capital = 0", () => {
      const capital = 0;
      const target = 1_000_000;
      const weeklyExpenses = 100_000;
      const milestones = evaluateMilestones(capital, target, weeklyExpenses);

      expect(milestones.every(m => !m.reached)).toBe(true);
    });
  });

  describe("Scenár 9: Nulové alebo chýbajúce výdavky", () => {
    it("expenses_covered_1w je unreached keď weeklyExpenses = undefined (0)", () => {
      const capital = 1_000_000;
      const weeklyExpenses = 0; // implementácia podporuje 0
      const milestones = evaluateMilestones(capital, 0, weeklyExpenses);

      const weekly = milestones.find(m => m.id === "expenses_covered_1w");
      expect(weekly?.reached).toBe(false);
    });

    it("ostatné míľniky fungujú aj keď weeklyExpenses = 0", () => {
      const capital = 100_000;
      const milestones = evaluateMilestones(capital, 0, 0);

      const first_1k = milestones.find(m => m.id === "first_1k");
      expect(first_1k?.reached).toBe(true);
    });
  });

  describe("Scenár 10: Rozlíšenie dosiahnutých a budúcich míľnikov", () => {
    it("MilestonesBlock dostane správny zoznam dosiahnutých vs budúcich", () => {
      const capital = 200_000; // viac ako 1k, menej ako 10k
      const target = 1_000_000;
      const weeklyExpenses = 50_000;
      const milestones = evaluateMilestones(capital, target, weeklyExpenses);

      const reached = milestones.filter(m => m.reached);
      const unreached = milestones.filter(m => !m.reached);

      // first_1k je dosiahnutý (200k >= 100k)
      expect(reached.some(m => m.id === "first_1k")).toBe(true);

      // first_10k nie je dosiahnutý (200k < 1M)
      expect(unreached.some(m => m.id === "first_10k")).toBe(true);

      // halfway_there je dosiahnutý (200k >= 500k? nie, 200k < 500k)
      expect(unreached.some(m => m.id === "halfway_there")).toBe(true);

      // expenses_covered_1w je dosiahnutý (200k >= 50k)
      expect(reached.some(m => m.id === "expenses_covered_1w")).toBe(true);
    });

    it("vracia Milestone[] s id, label a reached", () => {
      const milestones = evaluateMilestones(100_000, 0, 0);

      milestones.forEach(m => {
        expect(m).toHaveProperty("id");
        expect(m).toHaveProperty("label");
        expect(m).toHaveProperty("reached");
        expect(typeof m.reached).toBe("boolean");
        expect(typeof m.label).toBe("string");
      });
    });
  });

  describe("Edge cases a presnosť", () => {
    it("capital o 1 cent pod hranicou je unreached", () => {
      const capital = 99_999; // o 1 cent pod 1 000 EUR
      const milestones = evaluateMilestones(capital, 0, 0);

      const first_1k = milestones.find(m => m.id === "first_1k");
      expect(first_1k?.reached).toBe(false);
    });

    it("capital o 1 cent nad hranicou je reached", () => {
      const capital = 100_001; // o 1 cent nad 1 000 EUR
      const milestones = evaluateMilestones(capital, 0, 0);

      const first_1k = milestones.find(m => m.id === "first_1k");
      expect(first_1k?.reached).toBe(true);
    });

    it("halfway_there funguje s desatinnými výsledkami (zaokrúhľovanie)", () => {
      const target = 1_000_001; // 10 000,01 EUR
      const capital = 500_001; // 5 000,01 EUR (viac ako presne polovica)
      const milestones = evaluateMilestones(capital, target, 0);

      const halfway = milestones.find(m => m.id === "halfway_there");
      // capital >= target / 2 => 500001 >= 500000.5 => true
      expect(halfway?.reached).toBe(true);
    });
  });
});
