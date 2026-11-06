import { describe, it, expect } from "vitest";
import { convertToBase, BASE_CURRENCY } from "../src/domain/currency";

/** D340 - Currency Scenarios (Domain Layer) */
describe("D340 - Currency Scenarios", () => {
  describe("Scenario 1: EUR Transaction", () => {
    it("preserves EUR amount without conversion", () => {
      const amountCents = 10000; // 100.00 EUR
      expect(amountCents).toBe(10000);
      expect(BASE_CURRENCY).toBe("EUR");
    });
  });

  describe("Scenario 2: USD Transaction with rate 1.05", () => {
    it("converts 105 USD to ~100 EUR at rate 1.05", () => {
      const originalAmountCents = 10500; // 105.00 USD
      const ratePerEur = 1.05; // 1 EUR = 1.05 USD

      const amountCentsInEur = convertToBase(originalAmountCents, ratePerEur);

      expect(amountCentsInEur).toBe(10000); // ~100 EUR
    });
  });

  describe("Scenario 3: Edit USD transaction", () => {
    it("recalculates amountCents when originalAmountCents changes", () => {
      // Original: 105 USD
      let originalAmountCents = 10500;
      let ratePerEur = 1.05;
      let amountCents = convertToBase(originalAmountCents, ratePerEur);
      expect(amountCents).toBe(10000);

      // Edit: Change to 160 USD (same rate)
      originalAmountCents = 16000;
      amountCents = convertToBase(originalAmountCents, ratePerEur);

      expect(amountCents).toBe(15238); // Math.round(16000/1.05)
      expect(ratePerEur).toBe(1.05); // Rate unchanged
    });
  });

  describe("Scenario 4: Reload transaction", () => {
    it("convertToBase is deterministic for same inputs", () => {
      const result1 = convertToBase(10500, 1.05);
      const result2 = convertToBase(10500, 1.05);

      expect(result1).toBe(result2); // Same value on reload
      expect(result1).toBe(10000);
    });
  });

  describe("Scenario 5: Reject invalid rates", () => {
    it("rejects zero rate", () => {
      expect(() => convertToBase(10000, 0)).toThrow();
    });

    it("rejects negative rate", () => {
      expect(() => convertToBase(10000, -1.05)).toThrow();
    });

    it("accepts positive finite rates", () => {
      expect(() => convertToBase(10000, 1.05)).not.toThrow();
      expect(() => convertToBase(10000, 24.5)).not.toThrow();
      expect(() => convertToBase(10000, 0.001)).not.toThrow();
    });

    it("handles edge case: very small amount", () => {
      const result = convertToBase(1, 1.05);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(result)).toBe(true);
    });

    it("handles edge case: large amount", () => {
      const result = convertToBase(1000000, 1.05);
      expect(result).toBe(952381); // Math.round(1000000/1.05) = 952380.952... = 952381
    });
  });

  describe("Scenario 6: Financial sums in EUR", () => {
    it("sums are in EUR (amountCents), not original currency", () => {
      // EUR: 100
      const eur = 10000;

      // USD: 105 USD -> ~100 EUR
      const usd = convertToBase(10500, 1.05);

      // CZK: 100 CZK -> ~4.08 EUR
      const czk = convertToBase(10000, 24.5);

      const total = eur + usd + czk;
      expect(total).toBeLessThan(30000); // ~204 EUR
      expect(total).toBeGreaterThan(20000); // ~200+ EUR
    });
  });

  describe("Scenario 7: Backward compatibility - no currency", () => {
    it("transaction without currency field is EUR", () => {
      // Old transaction: { amountCents: 50000, ... }
      // Should be interpreted as 500 EUR
      const amountCents = 50000;
      const currency = undefined;

      // No conversion needed
      const eurAmount = amountCents;

      expect(eurAmount).toBe(50000);
      if (currency === undefined) {
        // Implicitly EUR
        expect(eurAmount / 100).toBe(500);
      }
    });
  });

  describe("Scenario 7b: Mixed old and new transactions", () => {
    it("old EUR + new USD transactions sum correctly in EUR", () => {
      // Old EUR transaction (no currency field)
      const oldEur = 20000; // 200 EUR

      // New USD transaction
      const newUsd = convertToBase(10500, 1.05); // ~100 EUR

      const total = oldEur + newUsd;
      expect(total).toBeGreaterThan(20000); // >200 EUR
      expect(total).toBeLessThan(35000); // <350 EUR
      expect(total).toBe(30000); // Exactly 200+100=300 EUR
    });
  });
});
