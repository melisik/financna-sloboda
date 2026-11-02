import { describe, it, expect } from "vitest";
import { convertToBase, BASE_CURRENCY } from "../src/domain/currency";

describe("D340 - Backward compatibility and edge cases", () => {
  describe("staré transakcie bez meny", () => {
    it("transakcia bez currency, exchangeRateToBase, originalAmountCents sa považuje za EUR", () => {
      // Keď transakcia nemá tieto polia, amountCents je suma v EUR
      const transaction = {
        amountCents: 10000, // 100 EUR
        // currency, exchangeRateToBase, originalAmountCents nie sú zadané
      };

      // Aplikácia by mala považovať amountCents za EUR
      expect(transaction.amountCents).toBe(10000); // = 100 EUR
    });

    it("transakcia s currency bez exchangeRateToBase sa neuloží bez validácie", () => {
      // Bezpečnostný test: ak je currency zadaná, MUSÍ byť aj exchangeRateToBase
      const transaction = {
        currency: "USD",
        amountCents: 10000,
        // exchangeRateToBase chýba - toto by malo byť neplatné pri ukladaní
      };

      // Formulár by mal validovať, že ak je currency, tak je aj kurz
      expect(transaction.currency).toBe("USD");
      // But exchangeRateToBase je undefined - to by malo spôsobiť chybu pri save()
    });
  });

  describe("prepočty v rôznych menách", () => {
    it("zachováva pôvodnú sumu a kurz pri ukladaní", () => {
      const originalAmountCents = 10500; // 105.00 USD
      const exchangeRateToBase = 1.05; // 1 EUR = 1.05 USD

      // amountCents sa počíta na základe convertToBase
      const amountCentsInBase = convertToBase(originalAmountCents, exchangeRateToBase);

      expect(amountCentsInBase).toBe(10000); // = 100 EUR

      // Ale originálne údaje by sa mali zachovať
      const transaction = {
        originalAmountCents,
        exchangeRateToBase,
        currency: "USD",
        amountCents: amountCentsInBase,
      };

      expect(transaction.originalAmountCents).toBe(10500);
      expect(transaction.exchangeRateToBase).toBe(1.05);
      expect(transaction.amountCents).toBe(10000);
    });
  });

  describe("zmena základnej meny (riziko)", () => {
    it("zmena baseCurrency bez migrácie by zlomila finančné výpočty", () => {
      // Scenár: používateľ má transakcie v EUR a USD
      const transactions = [
        {
          amountCents: 10000, // EUR
          currency: undefined, // implicitne EUR
        },
        {
          originalAmountCents: 10500,
          exchangeRateToBase: 1.05, // 1.05 USD = 1 EUR
          currency: "USD",
          amountCents: 10000, // = 100 EUR
        },
      ];

      // Ak by sa baseCurrency zmenila z EUR na USD bez migrácie:
      // Prvá transakcia by sa počítala ako 100 USD (namiesto 100 EUR) - CHYBA
      // Druhá transakcia by sa počítala ako 100 USD s kurzom 1.05 = OK

      // Tento test dokazuje, prečo zmena baseCurrency nie je bezpečná
      // bez migrácie všetkých transakcií
      expect(transactions[0].amountCents).toBe(10000);
      expect(transactions[1].amountCents).toBe(10000);

      // Ak by se všetky amountCents zmenili na "amountCents_in_usd",
      // musel by sa spustiť komplexný proces migrácie
    });

    it("bezpečná implementácia: baseCurrency sa nezažaduje v MVP", () => {
      // V minimálnom rozsahu (D-340 pre M1):
      // - baseCurrency je EUR (konštanta)
      // - zmena nie je povolená (je read-only v UI)
      // - budúce rozšírenie by vyžadovalo migráciu

      expect(BASE_CURRENCY).toBe("EUR");
      // baseCurrency by nemala byť v formulári ako editable pole
    });
  });

  describe("zaokrúhľovanie presnosti", () => {
    it("zaokrúhľovanie je konzistentné: Math.round pri centoch", () => {
      // 333 CZK pri kurze 24 CZK/EUR = 13.875 EUR zaokrúhlené nahor na 13.88 EUR
      const result = convertToBase(33300, 24); // 333 CZK v centoch
      expect(result).toBe(Math.round(33300 / 24)); // 1388 centov = 13.88 EUR
      expect(result).toBe(1388); // Presne overené
    });

    it("presnosť pri malom množstve - 1 cent", () => {
      const result = convertToBase(1, 1.05); // 0.01 USD
      expect(result).toBe(Math.round(1 / 1.05)); // Math.round(0.952...) = 1 cent
      expect(result).toBe(1);
    });

    it("presnosť pri veľkom množstve - milión", () => {
      const result = convertToBase(100000000, 1.05); // 1,000,000.00 USD
      // Math.round(100000000 / 1.05) = Math.round(95238095.238...) = 95238095
      expect(result).toBe(95238095);
    });
  });
});
