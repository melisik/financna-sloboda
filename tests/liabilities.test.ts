import { describe, expect, it } from "vitest";
import { activeLiabilityPaymentCents, liabilitiesTotals, liabilityInterestCents, liabilityIsActive } from "../src/domain/liabilities";
import { amortizeLoan, paymentBelowInterest } from "../src/domain/mortgage";
import { monthSummary } from "../src/domain/monthSummary";
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

describe("záväzky – stav splatenia a splátky (D-140)", () => {
  it("aktívny je len záväzok so zostatkom a neskončeným koncom; koniec dnes ešte platí", () => {
    expect(liabilityIsActive(uver, TODAY)).toBe(true);
    expect(liabilityIsActive({ ...uver, endDate: TODAY }, TODAY)).toBe(true);
    expect(liabilityIsActive({ ...uver, endDate: "2026-10-18" }, TODAY)).toBe(false);
    expect(liabilityIsActive({ ...uver, balanceCents: 0 }, TODAY)).toBe(false);
  });

  it("do splátok sa rátajú len aktívne záväzky", () => {
    const splatene = { ...uver, id: "z3", balanceCents: 0, monthlyPaymentCents: 7_000 };
    const skoncene = { ...uver, id: "z4", endDate: "2026-01-31", monthlyPaymentCents: 9_000 };
    expect(activeLiabilityPaymentCents([uver, splatene, skoncene], TODAY)).toBe(25_000);
  });

  it("mesačná splátka úveru ide do nevyhnutných výdavkov osobitne", () => {
    const s = monthSummary([], [], [], TODAY, 100_000, [], [uver, { ...uver, id: "z5", balanceCents: 0 }]);
    expect(s.liabilitiesCents).toBe(25_000);
    expect(s.byNecessity.nevyhnutne).toBe(25_000);
  });

  it("zostatok úveru sa splácania automaticky: istina za každý uplynulý mesiac", () => {
    // 10 000 € × 12 % / 12 = 100 € úrok; 1 000 € splátka → istina 900 €; druhý mesiac 910 000 × 1 % = 91 €
    const r = amortizeLoan(1_000_000, 0.12, 100_000, "2026-08-01", TODAY);
    expect(r).toEqual({ balanceCents: 819_100, balanceDate: "2026-10-01" });
  });

  it("zostatok sa nesmie dostať pod nulu a bez dátumu zostatku sa nesplácá", () => {
    expect(amortizeLoan(50_000, 0, 100_000, "2026-08-01", TODAY)).toEqual({ balanceCents: 0, balanceDate: "2026-10-01" });
    expect(amortizeLoan(1_000_000, 0.12, 100_000, undefined, TODAY)).toBeNull();
  });

  it("dátum zostatku sa validuje ako dátum", () => {
    expect(validateLiability({ ...uver, balanceDate: "2026-02-30" }, TODAY).join(" ")).toMatch(/neexistujúci dátum/);
    expect(validateLiability({ ...uver, balanceDate: "2026-10-01" }, TODAY)).toEqual([]);
  });
});

describe("splátka pod úrokom (nález 8)", () => {
  it("splátka, ktorá nepokryje mesačný úrok, sa označí", () => {
    // zostatok 1 000 €, úrok 12 % p. a. = 10 € za mesiac
    expect(paymentBelowInterest(100_000, 0.12, 1_000)).toBe(true);
    expect(paymentBelowInterest(100_000, 0.12, 1_001)).toBe(false);
    expect(paymentBelowInterest(0, 0.12, 1_000)).toBe(false);
    expect(paymentBelowInterest(100_000, 0, 1_000)).toBe(false);
    expect(paymentBelowInterest(100_000, 0.12, 0)).toBe(false);
  });
});
