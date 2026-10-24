import { describe, expect, it } from "vitest";
import { monthsToTargetSplit } from "../src/domain/capital";

const T = 60_000_000; // 600 000 €, v centoch

describe("monthsToTargetSplit: dlhý horizont (FR-02, D-046)", () => {
  it("bez mesačného sporenia do hotovosti je n nad 14 400 mesiacov číslo (uzavretý tvar, r = 0)", () => {
    // m_inv = 1 cent, r = 0: n = (T − K) / m = 60 000 000 mesiacov
    expect(monthsToTargetSplit({ inv: 0, cash: 0 }, 1, 0, 0, T)).toBe(60_000_000);
  });
});
