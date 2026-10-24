import { describe, expect, it } from "vitest";
import { monthsToTargetSplit } from "../src/domain/capital";
import { goalDisplay } from "../src/domain/goalDisplay";

const T = 60_000_000; // 600 000 €, v centoch

describe("monthsToTargetSplit: dlhý horizont (FR-02, D-046)", () => {
  it("bez mesačného sporenia do hotovosti je n nad 14 400 mesiacov číslo (uzavretý tvar, r = 0)", () => {
    // m_inv = 1 cent, r = 0: n = (T − K) / m = 60 000 000 mesiacov
    expect(monthsToTargetSplit({ inv: 0, cash: 0 }, 1, 0, 0, T)).toBe(60_000_000);
  });

  // nález T5 (docs/30; docs/32): s mesačným sporením do hotovosti cieľ nad strop 14 400 mesiacov nie je nedosiahnuteľný.
  // Vracia Infinity a zobrazí sa ako viac ako 50 rokov (D-019).
  it("nález T5: s mesačným sporením do hotovosti cieľ nad 14 400 mesiacov je over50, nie nedosiahnuteľný", () => {
    expect(monthsToTargetSplit({ inv: 0, cash: 0 }, 0, 1, 0, T)).toBe(Infinity);
    // 40 € mesačne, bez investícií: 15 000 mesiacov (1 250 rokov)
    const n = monthsToTargetSplit({ inv: 0, cash: 0 }, 0, 4_000, 0.035, T);
    expect(goalDisplay(n, "2026-10-01", "2026-10-23")).toEqual({ kind: "over50" });
  });
});
