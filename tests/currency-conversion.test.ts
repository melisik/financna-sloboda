import { describe, it, expect } from "vitest";
import { convertToBase, BASE_CURRENCY } from "../src/domain/currency";

describe("convertToBase - D340 Multi Currency", () => {
  it("konvertuje USD na EUR správne", () => {
    // 1.05 USD = 1.00 EUR; conversRate 1.05 = koľko USD za 1 EUR
    const originalCents = 105; // 1.05 USD
    const ratePerEur = 1.05;
    const result = convertToBase(originalCents, ratePerEur);
    expect(result).toBe(100); // 1.00 EUR
  });

  it("konvertuje CZK na EUR správne", () => {
    // 24 CZK = 1 EUR; conversRate 24.0
    const originalCents = 2400; // 24.00 CZK
    const ratePerEur = 24.0;
    const result = convertToBase(originalCents, ratePerEur);
    expect(result).toBe(100); // 1.00 EUR
  });

  it("zaokrúhľuje na centá správne (nadol)", () => {
    // 1.055 USD = 1.00524 EUR, zaokrúhlené na 100 centov
    const originalCents = 10550; // 105.50 (som omyl, je to 105.50 centov = 1.0550 USD)
    const ratePerEur = 1.05;
    const result = convertToBase(originalCents, ratePerEur);
    expect(result).toBe(Math.round(10550 / 1.05)); // presne: 10047.619..., zaokrúhlené 10048
  });

  it("vyhadzuje chybu pri neplatnom kurze", () => {
    expect(() => convertToBase(10000, 0)).toThrow("ratePerEur musí byť kladné číslo");
    expect(() => convertToBase(10000, -1.05)).toThrow("ratePerEur musí byť kladné číslo");
  });

  it("BASE_CURRENCY je EUR", () => {
    expect(BASE_CURRENCY).toBe("EUR");
  });

  it("zachováva presnosť pri malých sumách", () => {
    // 1 USD cent = 0.9524 EUR centov, zaokrúhlené na 1
    const result = convertToBase(1, 1.05);
    expect(result).toBe(1); // Math.round(1 / 1.05) = 1
  });

  it("zachováva presnosť pri veľkých sumách", () => {
    // 1 000 000 USD (10 000 EUR)
    const result = convertToBase(1000000, 1.05);
    expect(result).toBe(Math.round(1000000 / 1.05)); // 952380.95..., zaokrúhlené 952381
  });
});
