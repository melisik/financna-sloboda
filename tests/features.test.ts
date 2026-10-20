import { describe, expect, it } from "vitest";
import { isPhase2Section, PHASE2_SECTION_IDS, visibleSections } from "../src/app/features";

// Prepínač Fázy 2 (D-125): verejná zostava ju nezobrazuje. Syntetické hodnoty.
describe("prepínač Fázy 2", () => {
  const all = [{ id: "prehlad" }, { id: "vyhodnotenie" }, { id: "majetok" }, { id: "zaloha" }, { id: "sklad" }];

  it("pri vypnutej Fáze 2 zostanú len sekcie MVP", () => {
    expect(visibleSections(all, false).map((n) => n.id)).toEqual(["prehlad", "vyhodnotenie", "zaloha"]);
  });

  it("pri zapnutej Fáze 2 sú všetky sekcie", () => {
    expect(visibleSections(all, true)).toEqual(all);
  });

  it("MVP sekcie nie sú Fáza 2", () => {
    expect(isPhase2Section("prehlad")).toBe(false);
    expect(isPhase2Section("zaloha")).toBe(false);
    expect(PHASE2_SECTION_IDS.every((id) => isPhase2Section(id))).toBe(true);
  });
});
