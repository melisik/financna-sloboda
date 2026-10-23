import { describe, expect, it } from "vitest";
import { formatImpact, impactMonths, UNREACHABLE_IMPACT_TEXT } from "../src/domain/impact";

const eur = (x: number) => x * 100;

describe("impactMonths (FR-04, D-004)", () => {
  // GC-04: K_L = 100 000, K_pred = 105 000, m = 500, r = 4 % → dopad 5,99 → +6 mesiacov
  it("GC-04: K_pred = 105 000 € dá dopad približne +6 mesiacov", () => {
    const d = impactMonths(eur(100_000), eur(105_000), eur(500), 0.04, eur(600_000));
    expect(d).not.toBeNull();
    expect(d!).toBeCloseTo(5.99, 1);
    expect(formatImpact(d!)).toBe("predbežne +6 mesiacov");
  });

  // N1: 100 € sporené do hotovosti (K 100 000 → 100 100) → cca 0,12 mesiaca → v dňoch
  it("N1: 100 € dá dopad v dňoch, nie „bez zmeny“", () => {
    const d = impactMonths(eur(100_000), eur(100_100), eur(500), 0.04, eur(600_000));
    expect(d!).toBeCloseTo(0.121, 2);
    expect(formatImpact(d!)).toBe("predbežne +4 dni");
  });

  it("nulový dopad je „bez zmeny“", () => {
    expect(formatImpact(0)).toBe("bez zmeny");
  });

  it("zaokrúhľovanie je symetrické: ±2,5 mesiaca dá 3 mesiace", () => {
    expect(formatImpact(2.5)).toBe("predbežne +3 mesiace");
    expect(formatImpact(-2.5)).toBe("predbežne −3 mesiace");
  });

  it("plurály: 1 mesiac, 2 mesiace, 5 mesiacov", () => {
    expect(formatImpact(1)).toBe("predbežne +1 mesiac");
    expect(formatImpact(-2)).toBe("predbežne −2 mesiace");
    expect(formatImpact(5)).toBe("predbežne +5 mesiacov");
  });

  it("R26: nenulový dopad pod pol dňa nie je „bez zmeny“, ale „menej ako 1 deň“ so znamienkom", () => {
    expect(formatImpact(0.001)).toBe("predbežne +menej ako 1 deň");
    expect(formatImpact(-0.001)).toBe("predbežne −menej ako 1 deň");
    expect(formatImpact(0)).toBe("bez zmeny");
  });

  it("R26b: pri nedosiahnuteľnom cieli text uvádza možnosti, ako cieľ dosiahnuť", () => {
    expect(UNREACHABLE_IMPACT_TEXT).toMatch(/^Po tejto transakcii sa cieľ pri súčasnom sporení a výnose nedosiahne/);
    for (const k of ["(1)", "(2)", "(3)", "(4)"]) expect(UNREACHABLE_IMPACT_TEXT).toContain(k);
    expect(UNREACHABLE_IMPACT_TEXT).toMatch(/nie je finančným poradenstvom/);
  });
});
