import { describe, it, expect } from "vitest";
import { isValidEurString, parseEurStrict } from "../src/compaven-ui/propertyFormUtils";

describe("PropertyForm Input: Utility functions from propertyFormUtils.ts", () => {
  describe("Validácia vstupného poľa", () => {
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

  describe("Parsovanie do centov", () => {
    it("'1000.00' → 100000 centov", () => {
      expect(parseEurStrict("1000.00")).toBe(100000);
    });

    it("'1000.50' → 100050 centov", () => {
      expect(parseEurStrict("1000.50")).toBe(100050);
    });

    it("'0.01' → 1 cent", () => {
      expect(parseEurStrict("0.01")).toBe(1);
    });

    it("Prázdny reťazec → null", () => {
      expect(parseEurStrict("")).toBe(null);
    });

    it("Neplatný vstup '1250abc' → NaN (nie 1250!)", () => {
      expect(parseEurStrict("1250abc")).toBeNaN();
    });

    it("Neplatný vstup '1000.999' → NaN", () => {
      expect(parseEurStrict("1000.999")).toBeNaN();
    });
  });

  describe("Scenár: Interakcia s vstupným poľom", () => {
    it("Scenár 1: Písanie, vymazanie, opätovné písanie", () => {
      let valueStr = "1000.50"; // Užívateľ napíše
      expect(isValidEurString(valueStr)).toBe(true);

      valueStr = ""; // Užívateľ vymaže
      expect(isValidEurString(valueStr)).toBe(false);
      expect(parseEurStrict(valueStr)).toBe(null);

      valueStr = "2000.99"; // Užívateľ napíše znova
      expect(isValidEurString(valueStr)).toBe(true);
      expect(parseEurStrict(valueStr)).toBe(200099);
    });

    it("Scenár 2: Neplatný vstup, oprava", () => {
      let valueStr = "1250abc"; // Neplatný
      expect(isValidEurString(valueStr)).toBe(false);
      expect(parseEurStrict(valueStr)).toBeNaN();

      valueStr = "1250.00"; // Oprava
      expect(isValidEurString(valueStr)).toBe(true);
      expect(parseEurStrict(valueStr)).toBe(125000);
    });

    it("Scenár 3: Príliš veľa desatinných miest", () => {
      let valueStr = "1000.999"; // Príliš veľa
      expect(isValidEurString(valueStr)).toBe(false);

      valueStr = "1000.99"; // Oprava
      expect(isValidEurString(valueStr)).toBe(true);
    });
  });

  describe("Oddelenie vstupného text stavu od číselného stavu", () => {
    it("valueStr a valueCents sú nezávislé", () => {
      let valueStr = "1000.50";
      let valueCents = parseEurStrict(valueStr) ?? 0;

      expect(valueStr).toBe("1000.50");
      expect(valueCents).toBe(100050);

      // Užívateľ zmení vstupné pole
      valueStr = ""; // Vymazal
      expect(valueStr).toBe("");
      expect(valueCents).toBe(100050); // Nedotknul sa čísla!

      // Pri validácii pri Save
      if (valueStr && isValidEurString(valueStr)) {
        valueCents = parseEurStrict(valueStr) ?? valueCents;
      }
      expect(valueCents).toBe(100050); // Bez zmeny, pretože valueStr je prázdny
    });
  });

  describe("Rozlíšenie: Prázdne vs. Nula", () => {
    it("Prázdny vstup: null", () => {
      expect(parseEurStrict("")).toBe(null);
    });

    it("Nulový vstup: 0 centov", () => {
      expect(parseEurStrict("0")).toBe(0);
      expect(parseEurStrict("0.00")).toBe(0);
    });

    it("Nula je rozlíšená od prázdneho", () => {
      const empty = parseEurStrict("");
      const zero = parseEurStrict("0");
      expect(empty).toBe(null);
      expect(zero).toBe(0);
      expect(empty !== zero).toBe(true);
    });
  });

  describe("Presnosť: Bez straty centov", () => {
    it("1000.50 EUR sa zachová presne", () => {
      const valueStr = "1000.50";
      const cents = parseEurStrict(valueStr);
      expect(cents).toBe(100050);
      if (cents !== null && !Number.isNaN(cents)) {
        const reconstructed = (cents / 100).toFixed(2);
        expect(reconstructed).toBe("1000.50");
      }
    });

    it("1000.99 EUR sa zachová presne", () => {
      const valueStr = "1000.99";
      const cents = parseEurStrict(valueStr);
      expect(cents).toBe(100099);
      if (cents !== null && !Number.isNaN(cents)) {
        const reconstructed = (cents / 100).toFixed(2);
        expect(reconstructed).toBe("1000.99");
      }
    });

    it("0.01 EUR sa zachová presne", () => {
      const valueStr = "0.01";
      const cents = parseEurStrict(valueStr);
      expect(cents).toBe(1);
      if (cents !== null && !Number.isNaN(cents)) {
        const reconstructed = (cents / 100).toFixed(2);
        expect(reconstructed).toBe("0.01");
      }
    });
  });
});
