import { describe, expect, it } from "vitest";
import { dateSk, eur, monthYear } from "../src/ui/kit/format";

// Formátovanie pre používateľa (D-144): centy, dd.mm.rrrr, slovenské názvy mesiacov. Syntetické hodnoty.
describe("formátovanie peňazí a dátumov", () => {
  it("peniaze majú vždy dve desatinné miesta a znak €", () => {
    expect(eur(123450)).toMatch(/^1\s?234,50 €$/);
    expect(eur(0)).toMatch(/^0,00 €$/);
  });

  it("dátum sa zobrazí ako dd.mm.rrrr, neplatný text sa nezmení", () => {
    expect(dateSk("2026-10-22")).toBe("22.10.2026");
    expect(dateSk("nie je dátum")).toBe("nie je dátum");
  });

  it("mesiac a rok sú po slovensky", () => {
    expect(monthYear("2026-10-01")).toBe("októbra 2026");
  });
});
