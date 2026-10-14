import { describe, expect, it } from "vitest";
import { targetAmountCents } from "../src/domain/goal";

describe("targetAmountCents (FR-01)", () => {
  // GC-01: V = 24 000 €, p = 4 % → T = 600 000 €
  it("GC-01: V = 24 000 €, p = 4 % dá T = 600 000 €", () => {
    const expensesCents = 24_000 * 100;
    expect(targetAmountCents(expensesCents, 0.04)).toBe(600_000 * 100);
  });

  // GC-02: V = 24 000 €, p = 3 % → T = 800 000 € (FR-01, D-011)
  it("GC-02: V = 24 000 €, p = 3 % dá T = 800 000 €", () => {
    const expensesCents = 24_000 * 100;
    expect(targetAmountCents(expensesCents, 0.03)).toBe(800_000 * 100);
  });
});
