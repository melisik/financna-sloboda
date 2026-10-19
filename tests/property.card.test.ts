import { describe, expect, it } from "vitest";
import { countsInCapital, netPropertyValueCents, valueIsStale } from "../src/domain/property";
import { validateProperty } from "../src/storage/validate";
import type { Property } from "../src/storage/types";

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
  it("čistá hodnota je odhad mínus zostatok hypotéky", () => {
    expect(netPropertyValueCents(base)).toBe(15_000_000);
  });

  it("čistá hodnota môže byť záporná, ak hypotéka presahuje odhad", () => {
    expect(netPropertyValueCents({ ...base, mortgageBalanceCents: 35_000_000 })).toBe(-5_000_000);
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

  it("neznáme pole je odmietnuté", () => {
    expect(validateProperty({ ...base, iban: "x" }, TODAY).join(" ")).toMatch(/neznáme pole/);
  });
});
