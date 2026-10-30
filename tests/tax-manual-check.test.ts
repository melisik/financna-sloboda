import { describe, it, expect } from "vitest";
import { taxAdjustedReturn } from "../src/domain/tax";

describe("D-339 – priame overenie daňového výpočtu", () => {
  it("ETF držané aspoň rok: zachová 7 %", () => {
    expect(taxAdjustedReturn(0.07, "stocks_etf", 2)).toBeCloseTo(0.07);
  });

  it("ETF držané menej než rok: zníži 7 % na 5,67 %", () => {
    expect(taxAdjustedReturn(0.07, "stocks_etf", 0.5)).toBeCloseTo(0.0567);
  });

  it("Krypto: zníži 7 % na 5,67 % podľa implementovaného modelu", () => {
    expect(taxAdjustedReturn(0.07, "crypto", 2)).toBeCloseTo(0.0567);
  });

  it("Nehnuteľnosť: zníži 7 % na 5,67 % podľa implementovaného modelu", () => {
    expect(taxAdjustedReturn(0.07, "real_estate", 2)).toBeCloseTo(0.0567);
  });
});
