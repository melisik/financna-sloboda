import { describe, expect, it } from "vitest";
import { fullMonthsBetween } from "../src/domain/dates";
import { addMonths, amortizeMortgage, applyExtraPayment, paymentForMonths, remainingMonths } from "../src/domain/mortgage";
import { validateProperty } from "../src/storage/validate";
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

describe("mimoriadna splátka hypotéky (N-15, D-145)", () => {
  const TODAY = "2026-10-21";
  const mortgage = { mortgageBalanceCents: 10_000_000, mortgageRate: 0.036, monthlyPaymentCents: 50_000 };

  it("počet mesiacov sa počíta zo zostatku, sadzby a splátky; splátka bez úroku nikdy nesplatí", () => {
    expect(remainingMonths(100_000, 0, 50_000)).toBe(2);
    expect(remainingMonths(0, 0.036, 50_000)).toBe(0);
    expect(remainingMonths(10_000_000, 0.12, 50_000)).toBeNull();
    expect(remainingMonths(100_000, 0, 0)).toBeNull();
  });

  it("zníženie splátky zachová termín: nová splátka splatí zostatok za rovnaký počet mesiacov", () => {
    const before = remainingMonths(mortgage.mortgageBalanceCents, mortgage.mortgageRate, mortgage.monthlyPaymentCents)!;
    const r = applyExtraPayment(mortgage, 1_000_000, "znizit_splatku")!;
    expect(r.mortgageBalanceCents).toBe(9_000_000);
    expect(r.monthsBefore).toBe(before);
    expect(r.monthlyPaymentCents).toBeLessThan(mortgage.monthlyPaymentCents);
    expect(r.monthsAfter!).toBeLessThanOrEqual(before);
    expect(r.monthsAfter!).toBeGreaterThanOrEqual(before - 1);
    expect(paymentForMonths(9_000_000, 0.036, 3)).toBeGreaterThan(0);
  });

  it("skrátenie termínu nechá splátku a skráti termín", () => {
    const r = applyExtraPayment({ mortgageBalanceCents: 100_000, mortgageRate: 0, monthlyPaymentCents: 50_000 }, 60_000, "skratit_termin")!;
    expect(r).toEqual({ mortgageBalanceCents: 40_000, monthlyPaymentCents: 50_000, monthsBefore: 2, monthsAfter: 1 });
  });

  it("zníženie splátky, ktorá nepokrýva úrok, sa odmietne", () => {
    expect(applyExtraPayment({ mortgageBalanceCents: 10_000_000, mortgageRate: 0.12, monthlyPaymentCents: 50_000 }, 100_000, "znizit_splatku")).toBeNull();
  });

  it("validácia odmietne mimoriadnu splátku s nulovou sumou alebo neznámym režimom", () => {
    const base = { id: "h", mode: "vlastne_byvanie", valueCents: 30_000_000, valueDate: "2026-10-01", mortgageBalanceCents: 100_000, balanceDate: "2026-10-01", createdAt: "x", updatedAt: "x" };
    expect(validateProperty({ ...base, extraPayments: [{ id: "e", date: TODAY, amountCents: 1000, mode: "znizit_splatku" }] }, TODAY)).toEqual([]);
    expect(validateProperty({ ...base, extraPayments: [{ id: "e", date: TODAY, amountCents: 0, mode: "znizit_splatku" }] }, TODAY).join(" ")).toMatch(/suma musí byť/);
    expect(validateProperty({ ...base, extraPayments: [{ id: "e", date: TODAY, amountCents: 1000, mode: "iny" }] }, TODAY).join(" ")).toMatch(/režim/);
  });
});

describe("evidencia nehnuteľnosti pre dane (D-156)", () => {
  it("dátum obstarania, obstarávacia cena a dátum prenájmu sa validujú", () => {
    const base = { id: "h", mode: "prenajom", valueCents: 30_000_000, valueDate: "2026-10-01", mortgageBalanceCents: 0, createdAt: "x", updatedAt: "x" };
    expect(validateProperty({ ...base, acquisitionDate: "2015-06-01", acquisitionCostCents: 15_000_000, rentalStartDate: "2016-01-01" }, "2026-10-22")).toEqual([]);
    expect(validateProperty({ ...base, acquisitionDate: "2015-02-30" }, "2026-10-22").join(" ")).toMatch(/dátum obstarania/);
    expect(validateProperty({ ...base, acquisitionCostCents: -5 }, "2026-10-22").join(" ")).toMatch(/obstarávacia cena/);
    expect(validateProperty({ ...base, rentalStartDate: "2099-01-01" }, "2026-10-22").join(" ")).toMatch(/dátum začiatku prenájmu/);
  });
});
