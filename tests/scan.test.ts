import { describe, expect, it } from "vitest";
import { findExpiryDate, findProductName } from "../src/domain/scan";

// Čítanie údajov z textu obalu (sklad). Syntetické texty.
describe("skener obalu: dátum spotreby a názov", () => {
  it("dátum s kľúčovým slovom má prednosť pred ostatnými dátumami", () => {
    expect(findExpiryDate("Vyrobené 01.02.2026\nSpotrebujte do 15.03.2027")).toBe("2027-03-15");
  });

  it("dvojciferný rok a bodka, lomka aj pomlčka", () => {
    expect(findExpiryDate("Min. trvanlivosť: 2.1.26")).toBe("2026-01-02");
    expect(findExpiryDate("EXP 15/03/2027")).toBe("2027-03-15");
    expect(findExpiryDate("2027-03-15")).toBe("2027-03-15");
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
  });
});
