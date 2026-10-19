import { describe, expect, it } from "vitest";
import { isIncomeActive, monthlyIncomeCents } from "../src/domain/income";
import { validateIncome } from "../src/storage/validate";
import type { RegularIncome } from "../src/storage/types";

// D-102: pravidelné príjmy len zobrazujú; nemenia m. Syntetické hodnoty.
const TODAY = "2026-10-19";
const mzda: RegularIncome = {
  id: "p1",
  name: "mzda syntetická",
  amountCents: 120_000,
  dayOfMonth: 15,
  startDate: "2025-01-01",
  createdAt: "2026-10-19T10:00:00Z",
  updatedAt: "2026-10-19T10:00:00Z",
};

describe("pravidelné príjmy – platnosť a súčet (D-102)", () => {
  it("príjem bez konca trvá; pred začiatkom a po konci neplatí", () => {
    expect(isIncomeActive(mzda, TODAY)).toBe(true);
    expect(isIncomeActive({ ...mzda, startDate: "2026-11-01" }, TODAY)).toBe(false);
    expect(isIncomeActive({ ...mzda, endDate: "2026-10-18" }, TODAY)).toBe(false);
    expect(isIncomeActive({ ...mzda, endDate: "2026-10-19" }, TODAY)).toBe(true);
  });

  it("mesačný súčet berie len platné príjmy", () => {
    const najom: RegularIncome = { ...mzda, id: "p2", name: "nájom syntetický", amountCents: 90_000, endDate: "2026-10-01" };
    const buduci: RegularIncome = { ...mzda, id: "p3", startDate: "2027-01-01", amountCents: 50_000 };
    expect(monthlyIncomeCents([mzda, najom, buduci], TODAY)).toBe(120_000);
  });
});

describe("pravidelné príjmy – validácia", () => {
  it("platný príjem nemá chyby; koniec pred začiatkom je odmietnutý", () => {
    expect(validateIncome(mzda)).toEqual([]);
    expect(validateIncome({ ...mzda, endDate: "2024-12-31" }).join(" ")).toMatch(/koniec nesmie byť pred začiatkom/);
  });

  it("deň mimo 1–31 a záporná suma sú odmietnuté", () => {
    expect(validateIncome({ ...mzda, dayOfMonth: 32 }).join(" ")).toMatch(/deň v mesiaci/);
    expect(validateIncome({ ...mzda, amountCents: 0 }).join(" ")).toMatch(/suma musí byť/);
  });
});
