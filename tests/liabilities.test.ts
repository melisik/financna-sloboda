import { describe, expect, it } from "vitest";
import { liabilitiesTotals, liabilityInterestCents } from "../src/domain/liabilities";
import { validateLiability } from "../src/storage/validate";
import type { Liability } from "../src/storage/types";

// D-103: záväzky okrem hypotéky. Syntetické hodnoty.
const TODAY = "2026-10-19";
const uver: Liability = {
  id: "z1",
  name: "úver syntetický",
  kind: "uver",
  balanceCents: 1_200_000,
  rate: 0.09,
  monthlyPaymentCents: 25_000,
  endDate: "2029-12-31",
  createdAt: "2026-10-19T10:00:00Z",
  updatedAt: "2026-10-19T10:00:00Z",
};

describe("záväzky – výpočet (D-103)", () => {
  it("mesačný úrok je zostatok × sadzba / 12", () => {
    // 12 000 € × 9 % / 12 = 90 €
    expect(liabilityInterestCents(uver)).toBe(9_000);
  });

  it("súčty: dlh, mesačný odtok a úrok sa sčítajú cez všetky záväzky", () => {
    const kreditka: Liability = { ...uver, id: "z2", kind: "kreditka", balanceCents: 30_000, rate: 0.2, monthlyPaymentCents: 1_000 };
    expect(liabilitiesTotals([uver, kreditka])).toEqual({ debtCents: 1_230_000, monthlyPaymentCents: 26_000, monthlyInterestCents: 9_500 });
    expect(liabilitiesTotals([])).toEqual({ debtCents: 0, monthlyPaymentCents: 0, monthlyInterestCents: 0 });
  });
});

describe("záväzky – validácia", () => {
  it("platný záväzok nemá chyby; koniec v budúcnosti je povolený", () => {
    expect(validateLiability(uver, TODAY)).toEqual([]);
  });

  it("druh mimo katalógu, sadzba 100 % a neplatný koniec sú odmietnuté", () => {
    expect(validateLiability({ ...uver, kind: "pôžička" }, TODAY).join(" ")).toMatch(/druh musí byť/);
    expect(validateLiability({ ...uver, rate: 1 }, TODAY).join(" ")).toMatch(/úroková sadzba/);
    expect(validateLiability({ ...uver, endDate: "2029-02-30" }, TODAY).join(" ")).toMatch(/neexistujúci dátum/);
  });
});
