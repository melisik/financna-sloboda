import { describe, expect, it } from "vitest";
import { formatImpact } from "../src/domain/impact";

// Priemerný mesiac má 30,44 dňa (FR-04, N1), preto je dopad v dňoch X / 30,44.
const DAY = 1 / 30.44;

describe("formatImpact: skloňovanie mesiacov a dní (FR-04, N1)", () => {
  it("jeden mesiac a 2 až 4 mesiace", () => {
    expect(formatImpact(1)).toBe("predbežne +1 mesiac");
    expect(formatImpact(-2)).toBe("predbežne −2 mesiace");
    expect(formatImpact(3)).toBe("predbežne +3 mesiace");
    expect(formatImpact(4)).toBe("predbežne +4 mesiace");
  });

  it("5 a viac mesiacov a čísla 11 až 15 sú v tvare mesiacov", () => {
    expect(formatImpact(5)).toBe("predbežne +5 mesiacov");
    expect(formatImpact(11)).toBe("predbežne +11 mesiacov");
    expect(formatImpact(12)).toBe("predbežne +12 mesiacov");
    expect(formatImpact(14)).toBe("predbežne +14 mesiacov");
    expect(formatImpact(15)).toBe("predbežne +15 mesiacov");
    expect(formatImpact(20)).toBe("predbežne +20 mesiacov");
  });

  it("dni: 1 deň, 2 až 4 dni a 5 a viac dní", () => {
    expect(formatImpact(1 * DAY)).toBe("predbežne +1 deň");
    expect(formatImpact(3 * DAY)).toBe("predbežne +3 dni");
    expect(formatImpact(5 * DAY)).toBe("predbežne +5 dní");
  });

  // nález T3 (docs/30; docs/29 nález 2): plural() v src/domain/impact.ts vracia jednotný tvar
  // pre každé číslo končiace na 1 okrem 11, takže 21 dá „21 mesiac“. Správne je genitív plurálu (21 mesiacov, 31 mesiacov, 21 dní).
  it("nález T3: čísla končiace na 1 (okrem 11) sa skloňujú ako 5 a viac (21 mesiacov, 31 mesiacov, 21 dní)", () => {
    expect(formatImpact(21)).toBe("predbežne +21 mesiacov");
    expect(formatImpact(-31)).toBe("predbežne −31 mesiacov");
    expect(formatImpact(101)).toBe("predbežne +101 mesiacov");
    expect(formatImpact(21 * DAY)).toBe("predbežne +21 dní");
  });

  // Pokračovanie T3 (docs/30, jazyková kontrola; D-289): zložená číslovka končiaca na 2 až 4, písaná dovedna
  // (dvadsaťdva, šesťdesiattri), má podstatné meno v genitíve plurálu: 22 mesiacov, 63 mesiacov, 24 dní.
  it("čísla 22 až 24, 32 až 34 a pod. sa skloňujú ako 5 a viac; 2 až 4 ostávajú", () => {
    expect(formatImpact(22)).toBe("predbežne +22 mesiacov");
    expect(formatImpact(-23)).toBe("predbežne −23 mesiacov");
    expect(formatImpact(34)).toBe("predbežne +34 mesiacov");
    expect(formatImpact(63)).toBe("predbežne +63 mesiacov");
    expect(formatImpact(102)).toBe("predbežne +102 mesiacov");
    expect(formatImpact(24 * DAY)).toBe("predbežne +24 dní");
    expect(formatImpact(2)).toBe("predbežne +2 mesiace");
    expect(formatImpact(4 * DAY)).toBe("predbežne +4 dni");
  });

  // nález T7 (docs/30; docs/29 nález 6): NaN nemá stráž, takže text vznikne ako „−NaN dní“.
  it("nález T7: NaN na vstupe nesmie vyjsť do textu dopadu", () => {
    expect(formatImpact(NaN)).not.toMatch(/NaN/);
    expect(formatImpact(Infinity)).not.toMatch(/Infinity/);
  });
});
