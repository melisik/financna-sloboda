import { describe, expect, it } from "vitest";
import { householdMonthBalance, possibleDoubleEntries, type HouseholdMonthInput } from "../src/domain/householdBalance";
import { monthlyIncomeCents } from "../src/domain/income";
import { monthlyRecurringByCategory, monthlyRecurringTotalCents } from "../src/domain/recurring";
import type { Property, RecurringExpense, RegularIncome, RentalEntry, Transaction } from "../src/storage/types";

// Mesačná bilancia domácnosti (D-346): príjmy a výdavky oddelene, každá položka presne raz. Syntetické hodnoty v centoch.
const TODAY = "2026-11-15";
const T = "2026-11-01T10:00:00Z";

const mzda: RegularIncome = { id: "i1", name: "mzda syntetická", kind: "mzda", frequency: "mesacne", amountCents: 200_000, startDate: "2026-01-01", createdAt: T, updatedAt: T };
const vydavok = (id: string, amountCents: number, category: Transaction["category"], date = "2026-11-12"): Transaction =>
  ({ id, date, type: "vydavok", amountCents, source: "z_prijmu", category, createdAt: T, updatedAt: T });
const zaznam = (id: string, kind: RentalEntry["kind"], amountCents: number, date: string): RentalEntry => ({ id, kind, amountCents, date });
const prenajom = (id: string, rentalLedger: RentalEntry[], extra: Partial<Property> = {}): Property => ({
  id, mode: "prenajom", valueCents: 20_000_000, valueDate: "2026-10-01", mortgageBalanceCents: 10_000_000, mortgageRate: 0.036,
  monthlyPaymentCents: 60_000, monthlyRentCents: 50_000, rentalLedger, createdAt: T, updatedAt: T, ...extra,
});
const vstup = (over: Partial<HouseholdMonthInput>): HouseholdMonthInput => ({
  transactions: [], budgets: [], recurringExpenses: [], properties: [], liabilities: [], incomes: [mzda], ...over,
});

describe("scenár A: základný prenájom", () => {
  const d = vstup({
    transactions: [vydavok("t1", 100_000, "jedlo")],
    properties: [prenajom("p1", [zaznam("r1", "prijem", 50_000, "2026-11-05"), zaznam("r2", "vydavok", 10_000, "2026-11-10")])],
  });

  it("príjmy 2 500 €, výdavky 1 700 €, zostatok +800 €", () => {
    const b = householdMonthBalance(d, TODAY);
    expect(b.regularIncomeCents).toBe(200_000);
    expect(b.rentalIncomeCents).toBe(50_000);
    expect(b.totalIncomeCents).toBe(250_000);
    expect(b.housingCents).toBe(60_000);
    expect(b.rentalExpensesCents).toBe(10_000);
    expect(b.otherExpensesCents).toBe(100_000);
    expect(b.totalExpensesCents).toBe(170_000);
    expect(b.balanceCents).toBe(80_000);
  });

  it("Rozpočet (výdavky podľa kategórie) a Prehľad (rozpis) vychádzajú z rovnakých čísel", () => {
    const b = householdMonthBalance(d, TODAY);
    const s = b.summary;
    const byCategory = Object.values(s.spentByCategory).reduce((a, c) => a + c, 0);
    expect(s.spentByCategory["bývanie"]).toBe(60_000);
    expect(s.spentByCategory.jedlo).toBe(100_000);
    expect(byCategory + s.unassignedCents + s.liabilitiesCents + b.rentalExpensesCents).toBe(b.totalExpensesCents);
    expect(s.byNecessity.nevyhnutne + s.byNecessity.nie_nevyhnutne + s.byNecessity.ostatne + s.unassignedCents + b.rentalExpensesCents).toBe(b.totalExpensesCents);
  });
});

describe("scenár B: plánovaný nájom bez prijatej platby", () => {
  it("plánovaný nájom nezvýši príjmy: 2 000 €, výdavky 1 700 €, zostatok +300 €", () => {
    const b = householdMonthBalance(vstup({
      transactions: [vydavok("t1", 100_000, "jedlo")],
      properties: [prenajom("p1", [zaznam("r2", "vydavok", 10_000, "2026-11-10")])],
    }), TODAY);
    expect(b.plannedRentCents).toBe(50_000);
    expect(b.rentalIncomeCents).toBe(0);
    expect(b.totalIncomeCents).toBe(200_000);
    expect(b.totalExpensesCents).toBe(170_000);
    expect(b.balanceCents).toBe(30_000);
  });

  it("ostatné mesačné náklady z formulára sú odhad: do výdavkov sa nepočítajú, ukážu sa len ako plán", () => {
    const b = householdMonthBalance(vstup({ properties: [prenajom("p1", [], { monthlyOtherCostsCents: 10_000 })] }), TODAY);
    expect(b.plannedRentalCostsCents).toBe(10_000);
    expect(b.rentalExpensesCents).toBe(0);
    expect(b.totalExpensesCents).toBe(60_000);
  });
});

describe("scenár C: dve prenajímané nehnuteľnosti", () => {
  it("príjmy 3 000 €, výdavky 2 400 €, zostatok +600 €", () => {
    const ledger = (n: string) => [zaznam(`${n}a`, "prijem", 50_000, "2026-11-03"), zaznam(`${n}b`, "vydavok", 10_000, "2026-11-20")];
    const b = householdMonthBalance(vstup({
      transactions: [vydavok("t1", 100_000, "jedlo")],
      properties: [prenajom("p1", ledger("p1")), prenajom("p2", ledger("p2"))],
    }), TODAY);
    expect(b.totalIncomeCents).toBe(300_000);
    expect(b.housingCents).toBe(120_000);
    expect(b.rentalExpensesCents).toBe(20_000);
    expect(b.totalExpensesCents).toBe(240_000);
    expect(b.balanceCents).toBe(60_000);
  });

  it("evidencia sa priradí podľa mesiaca dátumu a pri inom režime ako prenájom sa nepočíta", () => {
    const p = prenajom("p1", [zaznam("a", "prijem", 50_000, "2026-10-31"), zaznam("b", "prijem", 50_000, "2026-12-01")]);
    expect(householdMonthBalance(vstup({ properties: [p] }), TODAY).rentalIncomeCents).toBe(0);
    const vlastne = { ...prenajom("p2", [zaznam("c", "prijem", 50_000, "2026-11-05")]), mode: "vlastne_byvanie" as const };
    expect(householdMonthBalance(vstup({ properties: [vlastne] }), TODAY).rentalIncomeCents).toBe(0);
  });
});

describe("scenár D: dvojitý zápis", () => {
  const p = prenajom("p1", [zaznam("r2", "vydavok", 10_000, "2026-11-10")]);

  it("výdavok v evidencii prenájmu aj ako transakcia: upozorní, nič nevynechá", () => {
    const d = vstup({ transactions: [vydavok("t2", 10_000, "dom a energie", "2026-11-11")], properties: [p] });
    expect(possibleDoubleEntries(d, TODAY)).toEqual([{ kind: "prenajom_transakcia", date: "2026-11-11", amountCents: 10_000 }]);
    expect(householdMonthBalance(d, TODAY).totalExpensesCents).toBe(60_000 + 10_000 + 10_000);
  });

  it("splátka hypotéky aj ako pravidelný výdavok alebo výdavok v bývaní (±1 €): upozorní", () => {
    const rec: RecurringExpense = { id: "e1", name: "hypotéka", category: "bývanie", frequency: "mesacne", amountCents: 60_050, startDate: "2026-01-01", createdAt: T, updatedAt: T };
    const d = vstup({ recurringExpenses: [rec], transactions: [vydavok("t3", 60_000, "bývanie", "2026-11-02")], properties: [p] });
    expect(possibleDoubleEntries(d, TODAY)).toEqual([
      { kind: "hypoteka_pravidelny", name: "hypotéka", amountCents: 60_050 },
      { kind: "hypoteka_transakcia", date: "2026-11-02", amountCents: 60_000 },
    ]);
  });

  it("rozdielne sumy alebo iný mesiac nie sú dvojitý zápis", () => {
    const d = vstup({ transactions: [vydavok("t4", 12_000, "dom a energie"), vydavok("t5", 10_000, "dom a energie", "2026-10-30"), vydavok("t6", 70_000, "bývanie")], properties: [p] });
    expect(possibleDoubleEntries(d, TODAY)).toEqual([]);
  });
});

describe("scenár E: platnosť v mesiaci", () => {
  const koniec10 = { ...mzda, endDate: "2026-11-10" };

  it("príjem ukončený 10. novembra patrí do novembra celý a v decembri je nulový", () => {
    expect(monthlyIncomeCents([koniec10], "2026-11-15")).toBe(200_000);
    expect(monthlyIncomeCents([koniec10], "2026-12-05")).toBe(0);
    expect(householdMonthBalance(vstup({ incomes: [koniec10] }), "2026-11-15").totalIncomeCents).toBe(200_000);
  });

  it("príjem celý mesiac, začínajúci v priebehu mesiaca a ukončený pred mesiacom", () => {
    expect(monthlyIncomeCents([mzda], TODAY)).toBe(200_000);
    expect(monthlyIncomeCents([{ ...mzda, startDate: "2026-11-20" }], TODAY)).toBe(200_000);
    expect(monthlyIncomeCents([{ ...mzda, startDate: "2026-12-01" }], TODAY)).toBe(0);
    expect(monthlyIncomeCents([{ ...mzda, endDate: "2026-10-31" }], TODAY)).toBe(0);
  });

  it("pravidelný výdavok s rovnakými hraničnými prípadmi", () => {
    const e: RecurringExpense = { id: "e", name: "predplatné", category: "predplatné a služby", frequency: "mesacne", amountCents: 1_500, startDate: "2026-01-01", createdAt: T, updatedAt: T };
    expect(monthlyRecurringTotalCents([e], TODAY)).toBe(1_500);
    expect(monthlyRecurringTotalCents([{ ...e, startDate: "2026-11-20" }], TODAY)).toBe(1_500);
    expect(monthlyRecurringTotalCents([{ ...e, endDate: "2026-11-10" }], TODAY)).toBe(1_500);
    expect(monthlyRecurringTotalCents([{ ...e, endDate: "2026-11-10" }], "2026-12-05")).toBe(0);
    expect(monthlyRecurringTotalCents([{ ...e, endDate: "2026-10-31" }], TODAY)).toBe(0);
    expect(monthlyRecurringByCategory([{ ...e, endDate: "2026-11-10" }], TODAY)).toEqual({ "predplatné a služby": 1_500 });
    expect(householdMonthBalance(vstup({ incomes: [], recurringExpenses: [{ ...e, endDate: "2026-11-10" }] }), TODAY).totalExpensesCents).toBe(1_500);
  });
});

// Scenár F (posledná splátka hypotéky) s časovou následnosťou automatického splácania: tests/mortgage-last-payment.test.ts (D-347).
