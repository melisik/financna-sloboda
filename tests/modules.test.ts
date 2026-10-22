import { describe, expect, it } from "vitest";
import { CORE_SECTION_IDS, OPTIONAL_MODULES, visibleSectionIds } from "../src/app/modules";

// Moduly a viditeľnosť sekcií (D-162). Syntetické hodnoty.
describe("moduly a viditeľnosť sekcií (D-162)", () => {
  it("jadro je vždy viditeľné, aj keď zostava moduly neponúka a výber je prázdny", () => {
    for (const choice of [null, [], ["majetok"]]) {
      for (const offered of [true, false]) {
        const ids = visibleSectionIds(choice, offered);
        for (const id of CORE_SECTION_IDS) expect(ids.has(id)).toBe(true);
      }
    }
  });

  it("rozpočet a pravidelné výdavky sú jadro", () => {
    expect(CORE_SECTION_IDS).toContain("rozpocet");
    expect(CORE_SECTION_IDS).toContain("pravidelne-vydavky");
  });

  it("bez uloženého výberu sú všetky voliteľné moduly zapnuté (správanie pred D-162)", () => {
    const ids = visibleSectionIds(null, true);
    for (const m of OPTIONAL_MODULES) for (const s of m.sections) expect(ids.has(s)).toBe(true);
  });

  it("výber zapína len zvolené moduly", () => {
    const ids = visibleSectionIds(["majetok", "dane"], true);
    expect(ids.has("majetok")).toBe(true);
    expect(ids.has("dane")).toBe(true);
    expect(ids.has("investicie")).toBe(false);
    expect(ids.has("sklad")).toBe(false);
  });

  it("zostava bez príznaku Fázy 2 nezobrazí voliteľné sekcie, ani keď sú vo výbere", () => {
    const ids = visibleSectionIds(["majetok", "investicie"], false);
    expect([...ids].sort()).toEqual([...CORE_SECTION_IDS].sort());
  });

  it("psy nemajú vlastný modul; sú v module dane", () => {
    expect(OPTIONAL_MODULES.some((m) => m.id === "psy")).toBe(false);
    expect(OPTIONAL_MODULES.find((m) => m.id === "dane")?.sections).toEqual(["dane"]);
  });
});
