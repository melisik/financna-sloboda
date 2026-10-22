import { describe, expect, it } from "vitest";
import { monthsToTarget } from "../src/domain/goal";
import { goalDisplay } from "../src/domain/goalDisplay";

const eur = (x: number) => x * 100;
const DL = "2026-10-14";

describe("zobrazenie dátumu pri neplatnom počte mesiacov (nález 5)", () => {
  it("NaN a záporný počet mesiacov sú nedosiahnuteľné, nikdy NaN dátum", () => {
    expect(goalDisplay(NaN, DL, DL)).toEqual({ kind: "unreachable" });
    expect(goalDisplay(-3, DL, DL)).toEqual({ kind: "unreachable" });
  });
});

describe("goalDisplay (FR-02, FR-10, D-019, D-024)", () => {
  // GC-12: K = 100 000, m = 500, r = 4 %, T = 2 000 000 → n ≈ 655,4 → „viac ako 50 rokov“
  it("GC-12: n nad 50 rokov sa zobrazí ako „viac ako 50 rokov“", () => {
    const n = monthsToTarget(eur(100_000), eur(500), 0.04, eur(2_000_000));
    expect(n!).toBeCloseTo(655.4, 1);
    expect(goalDisplay(n, DL, "2026-10-14")).toEqual({ kind: "over50" });
  });

  // GC-14: D_L = 2026-10-14, cieľ 2054-08-14; dnes = 2055-01-01 → stale, bez záporného času, dátum sa nemení
  it("GC-14: po dátume cieľa je stav „staršie vyhodnotenie“, dátum sa nemení", () => {
    const n = monthsToTarget(eur(100_000), eur(500), 0.04, eur(600_000));
    const res = goalDisplay(n, DL, "2055-01-01");
    expect(res).toEqual({ kind: "stale", date: "2054-08-14" });
  });

  it("GC-13 v zobrazení: pred cieľom je dátum a zostávajúci čas nezáporný", () => {
    const n = monthsToTarget(eur(100_000), eur(500), 0.04, eur(600_000));
    const res = goalDisplay(n, DL, "2026-10-14");
    expect(res).toMatchObject({ kind: "date", date: "2054-08-14" });
    if (res.kind === "date") expect(res.remainingMonths).toBeGreaterThanOrEqual(0);
  });

  // GC-07: n = 549 → dátum sa zobrazí (do 50 rokov)
  it("GC-07: n = 549 dá dátum (nie „viac ako 50 rokov“)", () => {
    const n = monthsToTarget(eur(100_000), 0, 0.04, eur(600_000));
    expect(goalDisplay(n, DL, "2026-10-14")).toMatchObject({ kind: "date", date: "2072-07-14" });
  });

  it("nedosiahnuteľné (null) a dosiahnuté (0) stavy", () => {
    expect(goalDisplay(null, DL, DL)).toEqual({ kind: "unreachable" });
    expect(goalDisplay(0, DL, DL)).toEqual({ kind: "reached", date: DL });
  });
});

// GC-13 (docs/07): dnešok sa posunie po poslednom vyhodnotení; dátum cieľa ostane a zostáva 332 mesiacov.
describe("GC-13: dátum cieľa sa nemení, keď sa posunie dnešok (D-024)", () => {
  it("dnes = 2026-12-14 bez nového vyhodnotenia: dátum 2054-08-14, zostáva 332 mesiacov", () => {
    const n = monthsToTarget(eur(100_000), eur(500), 0.04, eur(600_000));
    expect(goalDisplay(n, DL, "2026-12-14")).toEqual({ kind: "date", date: "2054-08-14", remainingMonths: 332 });
  });
});
