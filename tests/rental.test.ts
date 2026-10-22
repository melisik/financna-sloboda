import { describe, expect, it } from "vitest";
import { rentalTotalsForYear, rentalYears } from "../src/domain/rental";
import { validateRentalEntry } from "../src/storage/validate";
import type { RentalEntry } from "../src/storage/types";

// Ročná evidencia prenájmu (D-157). Syntetické hodnoty.
const e = (id: string, date: string, kind: RentalEntry["kind"], amountCents: number): RentalEntry => ({ id, date, kind, amountCents });
const TODAY = "2026-10-22";

describe("evidencia prenájmu (D-157)", () => {
  const list = [
    e("a", "2026-01-05", "prijem", 50_000),
    e("b", "2026-06-05", "prijem", 50_000),
    e("c", "2026-06-10", "vydavok", 8_000),
    e("d", "2025-12-31", "prijem", 40_000),
  ];

  it("súčet prijatého nájmu a výdavkov je za jeden kalendárny rok", () => {
    expect(rentalTotalsForYear(list, 2026)).toEqual({ incomeCents: 100_000, costsCents: 8_000, count: 3 });
    expect(rentalTotalsForYear(list, 2025)).toEqual({ incomeCents: 40_000, costsCents: 0, count: 1 });
    expect(rentalTotalsForYear(list, 2024)).toEqual({ incomeCents: 0, costsCents: 0, count: 0 });
  });

  it("roky sa zobrazujú od najnovšieho", () => {
    expect(rentalYears(list)).toEqual([2026, 2025]);
  });

  it("validácia odmietne nulovú sumu, zlý druh a budúci dátum", () => {
    expect(validateRentalEntry(list[0], TODAY)).toEqual([]);
    expect(validateRentalEntry({ ...list[0], amountCents: 0 }, TODAY).join(" ")).toMatch(/suma musí byť/);
    expect(validateRentalEntry({ ...list[0], kind: "dar" }, TODAY).join(" ")).toMatch(/druh/);
    expect(validateRentalEntry({ ...list[0], date: "2099-01-01" }, TODAY).join(" ")).toMatch(/dátum/);
  });
});
