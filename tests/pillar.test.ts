import { describe, expect, it } from "vitest";
import { investmentsTotalCents, monthlyContributionsTotalCents, positionValueCents } from "../src/domain/investments";
import { validatePosition } from "../src/storage/validate";
import type { Position } from "../src/storage/types";

// D-105: tretí pilier je položka investícií; vklad je len na zobrazenie. Syntetické hodnoty.
const TODAY = "2026-10-19";
const pillar: Position = {
  id: "t1",
  name: "účet tretieho piliera syntetický",
  kind: "treti_pilier",
  quantity: 1,
  unitPrice: 5_000,
  currency: "EUR",
  fxToEur: 1,
  valueDate: "2026-10-01",
  monthlyContributionCents: 10_000,
  createdAt: "2026-10-19T10:00:00Z",
  updatedAt: "2026-10-19T10:00:00Z",
};

describe("tretí pilier (D-105)", () => {
  it("stav účtu sa počíta do súčtu investícií", () => {
    expect(positionValueCents(pillar)).toBe(500_000);
    expect(investmentsTotalCents([pillar])).toBe(500_000);
  });

  it("mesačné vklady sa sčítajú len na zobrazenie a položky bez vkladu sa rátajú ako 0", () => {
    const iny: Position = { ...pillar, id: "t2", kind: "etf", monthlyContributionCents: undefined };
    expect(monthlyContributionsTotalCents([pillar, iny])).toBe(10_000);
  });

  it("platný tretí pilier nemá chyby; záporný vklad je odmietnutý", () => {
    expect(validatePosition(pillar, TODAY)).toEqual([]);
    expect(validatePosition({ ...pillar, monthlyContributionCents: -1 }, TODAY).join(" ")).toMatch(/mesačný vklad/);
  });
});
