import { describe, it, expect } from "vitest";
import { isValidEurString, parseEurStrict } from "../src/compaven-ui/propertyFormUtils";

describe("PropertyForm Utils: isValidEurString a parseEurStrict", () => {
  describe("isValidEurString: Validácia vstupného poľa", () => {
    it("'1000.00' je platný", () => {
      expect(isValidEurString("1000.00")).toBe(true);
    });

    it("'1000.50' je platný", () => {
      expect(isValidEurString("1000.50")).toBe(true);
    });

    it("'1000.5' je platný (bez vedúcej nuly)", () => {
      expect(isValidEurString("1000.5")).toBe(true);
    });

    it("'1000' je platný (bez centov)", () => {
      expect(isValidEurString("1000")).toBe(true);
    });

    it("'0.01' je platný", () => {
      expect(isValidEurString("0.01")).toBe(true);
    });

    it("'0' je platný", () => {
      expect(isValidEurString("0")).toBe(true);
    });

    it("Prázdny reťazec NIE je platný", () => {
      expect(isValidEurString("")).toBe(false);
    });

    it("Len medzery NIE sú platné", () => {
      expect(isValidEurString("   ")).toBe(false);
    });

    it("'1000.abc' NIE je platný", () => {
      expect(isValidEurString("1000.abc")).toBe(false);
    });

    it("'1250abc' NIE je platný (parseFloat by to akceptoval!)", () => {
      expect(isValidEurString("1250abc")).toBe(false);
    });

    it("'1000.999' NIE je platný (viac ako 2 desatinné miesta)", () => {
      expect(isValidEurString("1000.999")).toBe(false);
    });

    it("'-100' NIE je platný (záporné)", () => {
      expect(isValidEurString("-100")).toBe(false);
    });

    it("'abc' NIE je platný", () => {
      expect(isValidEurString("abc")).toBe(false);
    });

    it("'NaN' NIE je platný", () => {
      expect(isValidEurString("NaN")).toBe(false);
    });

    it("'Infinity' NIE je platný", () => {
      expect(isValidEurString("Infinity")).toBe(false);
    });
  });

  describe("parseEurStrict: Parsovanie do centov", () => {
    it("'1000.00' → 100000 centov", () => {
      expect(parseEurStrict("1000.00")).toBe(100000);
    });

    it("'1000.50' → 100050 centov", () => {
      expect(parseEurStrict("1000.50")).toBe(100050);
    });

    it("'0.01' → 1 cent", () => {
      expect(parseEurStrict("0.01")).toBe(1);
    });

    it("'0' → 0 centov", () => {
      expect(parseEurStrict("0")).toBe(0);
    });

    it("Prázdny reťazec → null", () => {
      expect(parseEurStrict("")).toBe(null);
    });

    it("Len medzery → null", () => {
      expect(parseEurStrict("   ")).toBe(null);
    });

    it("Neplatný vstup '1250abc' → NaN (nie 1250!)", () => {
      expect(parseEurStrict("1250abc")).toBeNaN();
    });

    it("Neplatný vstup '1000.999' → NaN", () => {
      expect(parseEurStrict("1000.999")).toBeNaN();
    });

    it("Záporné číslo '-100' → NaN", () => {
      expect(parseEurStrict("-100")).toBeNaN();
    });

    it("Neplatný text 'abc' → NaN", () => {
      expect(parseEurStrict("abc")).toBeNaN();
    });

    it("'NaN' text → NaN", () => {
      expect(parseEurStrict("NaN")).toBeNaN();
    });

    it("'Infinity' text → NaN", () => {
      expect(parseEurStrict("Infinity")).toBeNaN();
    });
  });

  describe("Rozlíšenie: null vs. NaN vs. číslo", () => {
    it("Prázdny vstup vrátí null", () => {
      expect(parseEurStrict("")).toBe(null);
    });

    it("Nula vrátí 0 centov (nie null)", () => {
      expect(parseEurStrict("0")).toBe(0);
    });

    it("Neplatný vstup vrátí NaN", () => {
      expect(parseEurStrict("1250abc")).toBeNaN();
    });

    it("null !== 0 (rozlíšenie prázdneho vstupu)", () => {
      const empty = parseEurStrict("");
      const zero = parseEurStrict("0");
      expect(empty).toBe(null);
      expect(zero).toBe(0);
      expect(empty !== zero).toBe(true);
    });
  });

  describe("Presnosť: Bez straty centov", () => {
    it("1000.50 EUR → 100050 centov → '1000.50' (round-trip)", () => {
      const cents = parseEurStrict("1000.50");
      expect(cents).toBe(100050);
      if (cents !== null && !Number.isNaN(cents)) {
        const reconstructed = (cents / 100).toFixed(2);
        expect(reconstructed).toBe("1000.50");
      }
    });

    it("1000.99 EUR → 100099 centov → '1000.99' (round-trip)", () => {
      const cents = parseEurStrict("1000.99");
      expect(cents).toBe(100099);
      if (cents !== null && !Number.isNaN(cents)) {
        const reconstructed = (cents / 100).toFixed(2);
        expect(reconstructed).toBe("1000.99");
      }
    });

    it("0.01 EUR → 1 cent → '0.01' (round-trip)", () => {
      const cents = parseEurStrict("0.01");
      expect(cents).toBe(1);
      if (cents !== null && !Number.isNaN(cents)) {
        const reconstructed = (cents / 100).toFixed(2);
        expect(reconstructed).toBe("0.01");
      }
    });

    it("0 EUR → 0 centov → '0.00' (round-trip)", () => {
      const cents = parseEurStrict("0");
      expect(cents).toBe(0);
      if (cents !== null && !Number.isNaN(cents)) {
        const reconstructed = (cents / 100).toFixed(2);
        expect(reconstructed).toBe("0.00");
      }
    });
  });
});
