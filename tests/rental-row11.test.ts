import { describe, expect, it } from "vitest";
import { rentalRow11 } from "../src/domain/rental";

// Riadok 11 tabuľky 1 (oddiel VI), poučenie k DP FO 2025, s. 13. Syntetické hodnoty.
describe("riadok 11 tabuľky 1 (D-158)", () => {
  it("stĺpec 1 je príjem znížený o 500 €, stĺpec 2 výdavky v rovnakom pomere", () => {
    // príklad z poučenia: príjem 9 948 €, výdavky 3 785 € → stĺpec 1 = 9 448 €
    expect(rentalRow11(994_800, 378_500)).toEqual({ col1Cents: 944_800, col2Cents: 359_476 });
  });

  it("príjem do 500 € nedáva nič a výdavky sa nepriradia", () => {
    expect(rentalRow11(40_000, 10_000)).toEqual({ col1Cents: 0, col2Cents: 0 });
    expect(rentalRow11(0, 5_000)).toEqual({ col1Cents: 0, col2Cents: 0 });
  });
});
