import { describe, expect, it } from "vitest";
import { monthsToTarget } from "../src/domain/goal";

// Výnos r sa uplatní na celý kapitál K vrátane už nasporenej sumy, nielen na nové sporenie (D-025, D-032). Syntetické hodnoty v centoch.
describe("výnos r na celý kapitál (D-025, D-032)", () => {
  it("bez mesačného sporenia dosiahne cieľ len vďaka výnosu r na existujúci kapitál", () => {
    expect(monthsToTarget(1_000_000, 0, 0, 2_000_000)).toBeNull();
    expect(monthsToTarget(1_000_000, 0, 0.035, 2_000_000)).not.toBeNull();
  });
});
