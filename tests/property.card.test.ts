import { describe, expect, it } from "vitest";
import { countsInCapital, monthlyCostsCents, netPropertyValueCents, splitPayment, valueIsStale } from "../src/domain/property";
import { validateProperty } from "../src/storage/validate";
import type { Property } from "../src/storage/types";
import { validateAsset, validatePosition } from "../src/storage/validate";
import { investmentsTotalCents, positionValueCents } from "../src/domain/investments";

// Syntetické hodnoty; karta majetku (docs/11_Karta_majetku.md).
const TODAY = "2026-10-19";
const base: Property = {
  id: "p1",
  mode: "prenajom",
  valueCents: 30_000_000,
  valueDate: "2026-10-01",
  mortgageBalanceCents: 15_000_000,
  monthlyRentCents: 90_000,
  createdAt: "2026-10-19T10:00:00Z",
  updatedAt: "2026-10-19T10:00:00Z",
};

describe("karta majetku – výpočet (D-080, D-093)", () => {
  it("čistá hodnota je odhad mínus zostatok hypotéky (D-092)", () => {
    expect(netPropertyValueCents(base)).toBe(15_000_000);
  });

  it("čistá hodnota môže byť záporná, ak hypotéka presahuje odhad", () => {
    expect(netPropertyValueCents({ ...base, mortgageBalanceCents: 35_000_000 })).toBe(-5_000_000);
  });

  it("mesačné náklady sú splátka plus ostatné; nevyplnené položky sa rátajú ako 0 (D-100)", () => {
    expect(monthlyCostsCents({ ...base, monthlyPaymentCents: 80_000, monthlyOtherCostsCents: 15_000 })).toBe(95_000);
    expect(monthlyCostsCents({ ...base, monthlyOtherCostsCents: 15_000 })).toBe(15_000);
    expect(monthlyCostsCents(base)).toBe(0);
  });

  it("splátka sa delí na úrok z aktuálneho zostatku a istinu (D-085)", () => {
    // zostatok 150 000 €, sadzba 3,6 % p. a. → úrok 450 € za mesiac; splátka 800 € → istina 350 €
    const r = splitPayment({ ...base, mortgageBalanceCents: 15_000_000, mortgageRate: 0.036, monthlyPaymentCents: 80_000 });
    expect(r).toEqual({ interestCents: 45_000, principalCents: 35_000 });
  });

  it("splátka nižšia ako úrok dá zápornú istinu (zostatok rastie)", () => {
    const r = splitPayment({ ...base, mortgageBalanceCents: 15_000_000, mortgageRate: 0.036, monthlyPaymentCents: 30_000 });
    expect(r.principalCents).toBeLessThan(0);
  });

  it("do K sa počíta len prenájom; vlastné bývanie a nezadané nie", () => {
    expect(countsInCapital(base)).toBe(true);
    expect(countsInCapital({ ...base, mode: "vlastne_byvanie" })).toBe(false);
    expect(countsInCapital({ ...base, mode: "nezadane" })).toBe(false);
  });

  it("odhad starší ako 12 mesiacov je zastaraný, čerstvý nie", () => {
    expect(valueIsStale("2025-10-18", TODAY)).toBe(true);
    expect(valueIsStale("2025-10-19", TODAY)).toBe(false);
    expect(valueIsStale("2026-10-01", TODAY)).toBe(false);
  });
});

describe("karta majetku – validácia (FR-20 až FR-23)", () => {
  it("platná nehnuteľnosť nemá chyby", () => {
    expect(validateProperty(base, TODAY)).toEqual([]);
  });

  it("režim mimo katalógu a záporný odhad sú odmietnuté", () => {
    const errors = validateProperty({ ...base, mode: "chata", valueCents: -1 }, TODAY);
    expect(errors.join(" ")).toMatch(/režim musí byť z katalógu/);
    expect(errors.join(" ")).toMatch(/odhad hodnoty/);
  });

  it("dátum odhadu v budúcnosti je odmietnutý", () => {
    expect(validateProperty({ ...base, valueDate: "2026-12-01" }, TODAY).join(" ")).toMatch(/budúcnosti/);
  });

  it("úroková sadzba mimo [0, 1) je odmietnutá", () => {
    expect(validateProperty({ ...base, mortgageRate: 3.6 }, TODAY).join(" ")).toMatch(/úroková sadzba/);
  });

  it("záporná splátka je odmietnutá", () => {
    expect(validateProperty({ ...base, monthlyPaymentCents: -1 }, TODAY).join(" ")).toMatch(/splátka musí byť/);
  });

  it("neznáme pole je odmietnuté", () => {
    expect(validateProperty({ ...base, iban: "x" }, TODAY).join(" ")).toMatch(/neznáme pole/);
  });
});

describe("ďalšie aktíva: automobil a ocenitelné právo (docs/11, bod 10)", () => {
  const asset = { id: "a1", kind: "automobil", name: "auto – syntetické", valueCents: 1_200_000, valueDate: "2026-10-01", createdAt: "2026-10-19T10:00:00Z", updatedAt: "2026-10-19T10:00:00Z" };

  it("platný automobil a právo nemajú chyby", () => {
    expect(validateAsset(asset, TODAY)).toEqual([]);
    expect(validateAsset({ ...asset, id: "a2", kind: "pravo", name: "podiel – syntetický" }, TODAY)).toEqual([]);
  });

  it("aktívum bez názvu, s iným typom alebo záporným odhadom je odmietnuté", () => {
    expect(validateAsset({ ...asset, name: "" }, TODAY).join(" ")).toMatch(/názov je povinný/);
    expect(validateAsset({ ...asset, kind: "chata" }, TODAY).join(" ")).toMatch(/typ musí byť/);
    expect(validateAsset({ ...asset, valueCents: -5 }, TODAY).join(" ")).toMatch(/odhad hodnoty/);
  });
});

describe("sekcia Investície (D-101)", () => {
  const pos = { id: "i1", name: "ETF syntetický", kind: "etf", quantity: 10, unitPrice: 50, currency: "EUR", fxToEur: 1, valueDate: "2026-10-01", createdAt: "2026-10-19T10:00:00Z", updatedAt: "2026-10-19T10:00:00Z" } as const;

  it("hodnota v eurách je počet × cena × kurz", () => {
    expect(positionValueCents(pos as never)).toBe(50_000);
    expect(positionValueCents({ ...pos, currency: "USD", unitPrice: 20, fxToEur: 0.92 } as never)).toBe(18_400);
  });

  it("suma investícií je súčet položiek", () => {
    expect(investmentsTotalCents([pos as never, { ...pos, id: "i2", quantity: 2, unitPrice: 100 } as never])).toBe(70_000);
    expect(investmentsTotalCents([])).toBe(0);
  });

  it("platná položka nemá chyby; kurz pri EUR musí byť 1; druh mimo katalógu je odmietnutý", () => {
    expect(validatePosition(pos, TODAY)).toEqual([]);
    expect(validatePosition({ ...pos, fxToEur: 0.9 }, TODAY).join(" ")).toMatch(/pri EUR musí byť kurz 1/);
    expect(validatePosition({ ...pos, kind: "neznamy" }, TODAY).join(" ")).toMatch(/druh musí byť/);
    expect(validatePosition({ ...pos, quantity: 0 }, TODAY).join(" ")).toMatch(/počet kusov/);
  });
});

