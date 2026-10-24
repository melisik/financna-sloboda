import { describe, expect, it } from "vitest";
import { NAV_GROUPS, SECTION_LABELS, groupOf, type SectionId } from "../src/app/navigation";
import { CORE_SECTION_IDS, OPTIONAL_MODULES } from "../src/app/modules";

// Navigácia (D-205): každá sekcia má názov a patrí do práve jednej skupiny menu.
const ALL = Object.keys(SECTION_LABELS) as SectionId[];

describe("navigácia: invarianty", () => {
  it("každá sekcia patrí do práve jednej skupiny", () => {
    for (const id of ALL) {
      expect(NAV_GROUPS.filter((g) => g.sections.includes(id)), id).toHaveLength(1);
    }
  });

  it("každá sekcia v skupine má názov a nie je v skupine dvakrát", () => {
    for (const g of NAV_GROUPS) {
      expect(new Set(g.sections).size, g.id).toBe(g.sections.length);
      for (const id of g.sections) expect(SECTION_LABELS[id], id).toBeTruthy();
    }
  });

  it("sekcie jadra aj voliteľných modulov sú v menu", () => {
    const inMenu = new Set(NAV_GROUPS.flatMap((g) => g.sections as string[]));
    for (const id of CORE_SECTION_IDS) expect(inMenu.has(id), id).toBe(true);
    for (const m of OPTIONAL_MODULES) for (const id of m.sections) expect(inMenu.has(id), `${m.id}: ${id}`).toBe(true);
  });

  it("scenáre výdavkov sú v skupine Peniaze hneď za Transakciami (N-12, N-12b)", () => {
    expect(groupOf("scenar-vydavku").id).toBe("peniaze");
    expect(groupOf("mesacny-vydavok").id).toBe("peniaze");
    const peniaze = NAV_GROUPS.find((g) => g.id === "peniaze")!.sections;
    expect(peniaze.slice(0, 3)).toEqual(["nova-transakcia", "scenar-vydavku", "mesacny-vydavok"]);
  });

  it("neznáma sekcia vyhodí chybu namiesto tichého pádu menu", () => {
    expect(() => groupOf("neexistuje" as SectionId)).toThrow();
  });
});
