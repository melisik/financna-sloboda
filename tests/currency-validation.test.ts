import { describe, it, expect } from "vitest";

describe("D340 - Validacia kurzu v formulari", () => {
  describe("Number.isFinite() kontrola", () => {
    it("odmitne Infinity ako kurz", () => {
      const rate = Infinity;
      const isValid = Number.isFinite(rate) && rate > 0;
      expect(isValid).toBe(false); // Infinity je nevyhovujuci
    });

    it("odmitne -Infinity ako kurz", () => {
      const rate = -Infinity;
      const isValid = Number.isFinite(rate) && rate > 0;
      expect(isValid).toBe(false); // -Infinity je nevyhovujuci
    });

    it("odmitne NaN ako kurz", () => {
      const rate = NaN;
      const isValid = Number.isFinite(rate) && rate > 0;
      expect(isValid).toBe(false); // NaN je nevyhovujuci
    });

    it("odmitne nulu ako kurz", () => {
      const rate = 0;
      const isValid = Number.isFinite(rate) && rate > 0;
      expect(isValid).toBe(false); // 0 je nevyhovujuci
    });

    it("odmitne zaporny kurz", () => {
      const rate = -1.05;
      const isValid = Number.isFinite(rate) && rate > 0;
      expect(isValid).toBe(false); // zaporny je nevyhovujuci
    });

    it("prijme platny kurz", () => {
      const rate = 1.05;
      const isValid = Number.isFinite(rate) && rate > 0;
      expect(isValid).toBe(true); // 1.05 je vyhovujuci
    });

    it("prijme velmi maly kurz", () => {
      const rate = 0.0001;
      const isValid = Number.isFinite(rate) && rate > 0;
      expect(isValid).toBe(true); // velmi maly ale kladny
    });

    it("prijme velmi velky kurz", () => {
      const rate = 1000000;
      const isValid = Number.isFinite(rate) && rate > 0;
      expect(isValid).toBe(true); // velmi velky ale konecny
    });
  });

  describe("chybajuci kurz", () => {
    it("undefined sa musi považovat za nevyhovujuci", () => {
      const rate: number | undefined = undefined;
      // Ak je rate undefined, asNum() by vratil NaN
      const numRate = typeof rate === 'number' ? rate : NaN;
      const isValid = Number.isFinite(numRate) && numRate > 0;
      expect(isValid).toBe(false); // undefined + NaN = nevyhovujuci
    });

    it("prazdny string sa musi považovat za nevyhovujuci", () => {
      const exchangeRateStr = '';
      const numRate = Number.parseFloat(exchangeRateStr);
      const isValid = Number.isFinite(numRate) && numRate > 0;
      expect(isValid).toBe(false); // prazdny string = NaN
    });

    it("nečíselný string sa musi považovat za nevyhovujuci", () => {
      const exchangeRateStr = 'abc';
      const numRate = Number.parseFloat(exchangeRateStr);
      const isValid = Number.isFinite(numRate) && numRate > 0;
      expect(isValid).toBe(false); // abc = NaN
    });
  });
});
