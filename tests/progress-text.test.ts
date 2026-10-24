import { describe, expect, it } from "vitest";
import { progressLine, shiftLine } from "../src/features/prehlad/progressText";
import { eur } from "../src/ui/kit/format";

// Texty pokroku na Prehľade (D-283): vecne, bez hodnotenia (docs/03, zásada 2).
describe("texty pokroku", () => {
  it("pokrok uvádza percento a obe sumy; suma sa nezalomí pred €", () => {
    const keep = (c: number) => eur(c).replace(/ €$/, "\u00a0€");
    expect(progressLine({ haveCents: 30_400_000, targetCents: 60_000_000, percent: 50 })).toBe(`Pokrok: 50\u00a0% (${keep(30_400_000)} z ${keep(60_000_000)})`);
    expect(progressLine({ haveCents: 30_400_000, targetCents: 60_000_000, percent: 50 })).not.toMatch(/ €/);
  });

  it("posun dátumu: bližšie, ďalej, bez zmeny, so správnym tvarom slova mesiac", () => {
    expect(shiftLine({ months: 9, since: "2026-08-31" })).toBe("Od vyhodnotenia 31.08.2026 sa dátum cieľa posunul o 9 mesiacov bližšie.");
    expect(shiftLine({ months: 1, since: "2026-08-31" })).toBe("Od vyhodnotenia 31.08.2026 sa dátum cieľa posunul o 1 mesiac bližšie.");
    expect(shiftLine({ months: -2, since: "2026-08-31" })).toBe("Od vyhodnotenia 31.08.2026 sa dátum cieľa posunul o 2 mesiace ďalej.");
    expect(shiftLine({ months: 0, since: "2026-08-31" })).toBe("Od vyhodnotenia 31.08.2026 sa dátum cieľa nezmenil.");
  });
});
