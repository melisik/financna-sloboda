import { describe, expect, it } from "vitest";
import { addMonths, amortizeMortgage, fullMonthsBetween } from "../src/domain/mortgage";
import { housingFlowCents, propertyChangedSince } from "../src/domain/property";
import { monthSummary } from "../src/domain/monthSummary";
import type { Property } from "../src/storage/types";

// Hypotéka, bývanie v rozpočte a upozornenie na zmenu majetku (D-137). Syntetické hodnoty.
const base: Property = { id: "p", mode: "vlastne_byvanie", valueCents: 30000000, valueDate: "2026-10-01", mortgageBalanceCents: 100000, mortgageRate: 0.036, monthlyPaymentCents: 50000, balanceDate: "2026-08-01", createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T10:00:00Z" };

describe("mesiace a dátumy", () => {
  it("plné mesiace: neskorší deň v mesiaci musí byť dosiahnutý", () => {
    expect(fullMonthsBetween("2026-08-01", "2026-10-21")).toBe(2);
    expect(fullMonthsBetween("2026-08-22", "2026-10-21")).toBe(1);
    expect(fullMonthsBetween("2026-10-21", "2026-10-21")).toBe(0);
    expect(fullMonthsBetween("2026-10-21", "2026-08-01")).toBe(0);
  });

  it("pridanie mesiacov orezáva deň na koniec mesiaca", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-08-01", 2)).toBe("2026-10-01");
  });
});

describe("automatické splácanie hypotéky", () => {
  it("za každý uplynulý mesiac sa zníži zostatok o istinu a dátum zostatku sa posunie", () => {
    // 1000 € s úrokom 3,6 % a splátkou 500 €: mesiac 1 → 503 €, mesiac 2 → 451 €.
    expect(amortizeMortgage(base, "2026-10-21")).toEqual({ mortgageBalanceCents: 451, balanceDate: "2026-10-01" });
  });

  it("bez dátumu zostatku, bez splátky alebo bez uplynulého mesiaca sa nič nemení", () => {
    expect(amortizeMortgage({ ...base, balanceDate: undefined }, "2026-10-21")).toBeNull();
    expect(amortizeMortgage({ ...base, monthlyPaymentCents: 0 }, "2026-10-21")).toBeNull();
    expect(amortizeMortgage(base, "2026-08-15")).toBeNull();
  });

  it("zaplatená hypotéka skončí na nule a ďalší výpočet nič nezmení", () => {
    const paid = amortizeMortgage({ ...base, mortgageBalanceCents: 40000 }, "2027-06-01");
    expect(paid?.mortgageBalanceCents).toBe(0);
    expect(amortizeMortgage({ ...base, mortgageBalanceCents: 0 }, "2027-06-01")).toBeNull();
  });
});

describe("bývanie v rozpočte a zmena majetku", () => {
  const rental: Property = { ...base, id: "r", mode: "prenajom", monthlyRentCents: 30000, monthlyPaymentCents: 50000 };

  it("bývanie je splátky mínus nájom; bez hypotéky sa splátka nerátа", () => {
    expect(housingFlowCents([rental])).toBe(20000);
    expect(housingFlowCents([{ ...rental, mortgageBalanceCents: 0 }])).toBe(-30000);
  });

  it("mesačný prehľad zahrnie bývanie do nevyhnutných výdavkov", () => {
    expect(monthSummary([], [], [], "2026-10-21", 0, [rental]).byNecessity.nevyhnutne).toBe(20000);
  });

  it("upozornenie na zmenu sa týka len nehnuteľnosti v K (prenájom) zmenenej po vyhodnotení", () => {
    expect(propertyChangedSince([rental], "2026-10-01T09:00:00Z")).toBe(true);
    expect(propertyChangedSince([rental], "2026-10-01T11:00:00Z")).toBe(false);
    expect(propertyChangedSince([{ ...rental, mode: "vlastne_byvanie" }], "2026-10-01T09:00:00Z")).toBe(false);
  });
});
