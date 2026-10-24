import { describe, expect, it } from "vitest";
import { checkDate } from "../src/storage/validate";

const TODAY = "2026-10-23";
const FORMAT = "d: dátum musí mať tvar RRRR-MM-DD";

describe("checkDate: platnosť dátumu vo vstupe (D-144)", () => {
  it("dnešný deň a dni v minulosti nemajú chybu", () => {
    expect(checkDate("2026-10-23", TODAY, "d")).toEqual([]);
    expect(checkDate("2026-10-22", TODAY, "d")).toEqual([]);
    expect(checkDate("1999-12-31", TODAY, "d")).toEqual([]);
  });

  it("29. 2. existuje len v priestupnom roku", () => {
    expect(checkDate("2028-02-29", "2030-01-01", "d")).toEqual([]);
    expect(checkDate("2025-02-29", TODAY, "d")).toEqual(["d: neexistujúci dátum"]);
  });

  it("neexistujúci deň alebo mesiac je chyba", () => {
    for (const v of ["2026-02-30", "2026-04-31", "2026-13-01", "2026-00-10", "2026-10-00", "2026-10-32"]) {
      expect(checkDate(v, TODAY, "d")).toEqual(["d: neexistujúci dátum"]);
    }
  });

  it("zlý tvar (bez núl, lomky, čas, medzera, prázdny text) je chyba tvaru", () => {
    for (const v of ["2026-1-5", "26-10-23", "2026/10/23", "2026-10-23T10:00", " 2026-10-23", ""]) {
      expect(checkDate(v, TODAY, "d")).toEqual([FORMAT]);
    }
  });

  it("hodnota, ktorá nie je text, je chyba tvaru", () => {
    for (const v of [20261023, null, undefined, {}, ["2026-10-23"]]) {
      expect(checkDate(v, TODAY, "d")).toEqual([FORMAT]);
    }
  });

  it("dátum v budúcnosti je chyba a rovnaký deň dnes nie", () => {
    expect(checkDate("2026-10-24", TODAY, "d")).toEqual(["d: dátum nesmie byť v budúcnosti"]);
    expect(checkDate("2026-10-23", TODAY, "d")).toEqual([]);
  });

  it("správa nesie označenie poľa", () => {
    expect(checkDate("zle", TODAY, "nastavenia: D_L")).toEqual(["nastavenia: D_L: dátum musí mať tvar RRRR-MM-DD"]);
  });

  // nález T8 (docs/30): Date.UTC mapuje roky 0–99 na 1900–1999, takže platný ISO dátum s rokom 0050 sa odmietne.
  // Nízka závažnosť: aplikácia takéto roky nepoužíva.
  it("nález T8: rok 0050 je platný ISO dátum a nemá dať chybu „neexistujúci dátum“", () => {
    expect(checkDate("0050-01-01", TODAY, "d")).toEqual([]);
  });
});
