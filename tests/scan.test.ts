import { describe, expect, it } from "vitest";
import { findExpiryDate, findProductName } from "../src/domain/scan";

// Čítanie údajov z textu obalu (sklad). Syntetické texty.
describe("skener obalu: dátum spotreby a názov (D-235)", () => {
  it("dátum s kľúčovým slovom má prednosť pred ostatnými dátumami", () => {
    expect(findExpiryDate("Vyrobené 01.02.2026\nSpotrebujte do 15.03.2027")).toBe("2027-03-15");
  });

  it("dvojciferný rok a bodka, lomka aj pomlčka", () => {
    expect(findExpiryDate("Min. trvanlivosť: 2.1.26")).toBe("2026-01-02");
    expect(findExpiryDate("EXP 15/03/2027")).toBe("2027-03-15");
    expect(findExpiryDate("2027-03-15")).toBe("2027-03-15");
  });

  it("len mesiac a rok sa prevedie na posledný deň mesiaca", () => {
    expect(findExpiryDate("Spotrebujte do 10.2027")).toBe("2027-10-31");
    expect(findExpiryDate("Min. trv. do 02/2028")).toBe("2028-02-29");
    expect(findExpiryDate("Spotrebujte do 13.2027")).toBeUndefined();
  });

  it("celý dátum má prednosť pred mesiacom a rok sa nečíta z vnútra dátumu", () => {
    expect(findExpiryDate("Vyrobené 10.2027\nSpotrebujte do 15.03.2027")).toBe("2027-03-15");
    expect(findExpiryDate("Spotrebujte do 15.03.2027")).toBe("2027-03-15");
  });

  it("neplatný kalendárny dátum sa nepoužije", () => {
    expect(findExpiryDate("Spotrebujte do 31.02.2027")).toBeUndefined();
  });

  it("text bez dátumu vráti undefined", () => {
    expect(findExpiryDate("MLIEKO 3,5 % 1 l")).toBeUndefined();
  });

  it("názov je prvý riadok s textom, nie dátum ani číslo", () => {
    expect(findProductName("12345\nMLIEKO POLTRÁCKE\nSpotrebujte do 1.2.2027")).toBe("MLIEKO POLTRÁCKE");
    expect(findProductName("12.03.2027\n99")).toBeUndefined();
    expect(findProductName("Nestle CINI Minis\n10.2027")).toBe("Nestle CINI Minis");
  });
});

// Ďalšie tvary dátumu na obaloch a chyby OCR (D-130). Syntetické texty.
describe("skener obalu: ďalšie tvary dátumu", () => {
  it("medzery, rok na začiatku, skrátený rok s mesiacom a kľúčové slovo Najlepšie pred", () => {
    expect(findExpiryDate("Spotrebujte do 15 03 2027")).toBe("2027-03-15");
    expect(findExpiryDate("Spotrebujte do 2027.03.15")).toBe("2027-03-15");
    expect(findExpiryDate("EXP 03/27")).toBe("2027-03-31");
    expect(findExpiryDate("Najlepšie pred 15.03.2027")).toBe("2027-03-15");
  });

  it("chyby OCR v číslicách dátumu (O namiesto 0, l namiesto 1)", () => {
    expect(findExpiryDate("Spotrebujte do l5.O3.2O27")).toBe("2027-03-15");
  });

  it("dátum výroby bez kľúčového slova sa nepoužije ako dátum spotreby", () => {
    expect(findExpiryDate("Vyrobené 01.02.2026")).toBeUndefined();
    expect(findExpiryDate("Vyrobené 01.09.2026 Spotrebujte do 15.03.2027")).toBe("2027-03-15");
  });
});
