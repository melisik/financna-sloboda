import { describe, expect, it } from "vitest";
import { monthsToTargetWithRentals, type Rental } from "../src/domain/rentalGoal";

// Čistý nájom po splatení hypotéky ide do mesačného sporenia a tok sa počíta ako ostatné sporenie (D-087). Sumy v centoch, syntetické hodnoty.
const NET_RENT = 50_000; // 500 € čistého nájmu mesačne
const TARGET = 30_000_000; // 300 000 €
const CAPITAL = { inv: 10_000_000, cash: 0 };
const paidOff: Rental = { valueCents: 0, mortgageBalanceCents: 0, mortgageRate: 0, paymentCents: 0, netRentCents: NET_RENT };
const nothing: Rental = { valueCents: 0, mortgageBalanceCents: 0, mortgageRate: 0, paymentCents: 0, netRentCents: 0 };

describe("čistý nájom po splatení hypotéky (D-087)", () => {
  it("nájom bez splátky dá rovnaký výsledok ako rovnaké mesačné sporenie do hotovosti", () => {
    const fromRent = monthsToTargetWithRentals(CAPITAL, 0, 0, 0.035, TARGET, [paidOff]);
    expect(fromRent.kind).toBe("months");
    expect(fromRent).toEqual(monthsToTargetWithRentals(CAPITAL, 0, NET_RENT, 0.035, TARGET, [nothing]));
  });
});
