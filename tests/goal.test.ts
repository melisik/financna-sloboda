import { describe, expect, it } from "vitest";
import { targetAmountCents } from "../src/domain/goal";

describe("targetAmountCents (FR-01)", () => {
  // GC-01: V = 24 000 €, p = 4 % → T = 600 000 €
  it("GC-01: V = 24 000 €, p = 4 % dá T = 600 000 €", () => {
    const expensesCents = 24_000 * 100;
    expect(targetAmountCents(expensesCents, 0.04)).toBe(600_000 * 100);
  });
});
