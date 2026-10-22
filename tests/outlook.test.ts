import { describe, expect, it } from "vitest";
import { futureOutlook } from "../src/domain/outlook";
import type { RegularIncome } from "../src/storage/types";

// Výhľad príjmov (docs/14, D-154). Syntetické hodnoty.
const base = { frequency: "mesacne" as const, amountCents: 80_000, createdAt: "2026-10-22T10:00:00Z", updatedAt: "2026-10-22T10:00:00Z" };
const pension: RegularIncome = { ...base, id: "p1", name: "dôchodok syntetický", kind: "starobny_dochodok", startDate: "2031-03-01" };
const benefit: RegularIncome = { ...base, id: "b1", name: "dávka syntetická", kind: "socialna_davka", startDate: "2027-01-01" };
const salary: RegularIncome = { ...base, id: "s1", name: "mzda syntetická", kind: "mzda", startDate: "2028-01-01" };
const pastPension: RegularIncome = { ...base, id: "p0", name: "starý dôchodok", kind: "starobny_dochodok", startDate: "2026-01-01" };

describe("výhľad príjmov (D-154)", () => {
  it("ukáže len budúce dôchodky a dávky, od najskoršieho", () => {
    expect(futureOutlook([pension, salary, benefit, pastPension], "2026-10-22").map((i) => i.id)).toEqual(["b1", "p1"]);
  });

  it("dnešný začiatok ani minulosť sa nezobrazia a bez budúcich položiek je výhľad prázdny", () => {
    expect(futureOutlook([{ ...pension, startDate: "2026-10-22" }], "2026-10-22")).toEqual([]);
    expect(futureOutlook([pastPension, salary], "2026-10-22")).toEqual([]);
  });
});
