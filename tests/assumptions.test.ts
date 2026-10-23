import { describe, expect, it } from "vitest";
import { LONG_HORIZON_MONTHS, netRealReturn, nominalFromReal, RETURN_ASSUMPTIONS } from "../src/domain/assumptions";
import { recommendedSettings } from "../src/domain/recommendations";
import { validateSettings } from "../src/storage/validate";

describe("výnosové predpoklady (D-050, D-062 až D-065)", () => {
  it("predvolený reálny výnos je 3,5 % a zhoduje sa s odporúčanými nastaveniami", () => {
    expect(RETURN_ASSUMPTIONS.realReturn).toBe(0.035);
    expect(recommendedSettings(2_400_000).realReturn).toBe(RETURN_ASSUMPTIONS.realReturn);
  });

  it("predvolená miera výberu je 3,7 % a neupravuje sa (D-069)", () => {
    expect(recommendedSettings(2_400_000).withdrawalRate).toBe(0.037);
  });

  it("nominálny ekvivalent (zobrazenie, D-077): (1 + 3,5 %)(1 + 2 %) − 1 ≈ 5,57 %", () => {
    expect(nominalFromReal(0.035, 0.02)).toBeCloseTo(0.0557, 6);
  });

  it("poplatky sa odpočítajú od reálneho výnosu a výsledok nie je záporný", () => {
    expect(netRealReturn(0.035, 0.005)).toBeCloseTo(0.03, 10);
    expect(netRealReturn(0.02, 0.03)).toBe(0);
    expect(netRealReturn(0.035)).toBe(0.035);
  });

  it("dlhý horizont je viac ako 20 rokov (240 mesiacov)", () => {
    expect(LONG_HORIZON_MONTHS).toBe(240);
  });
});

describe("poplatky v nastaveniach (D-064)", () => {
  const base = { expensesCents: 2_400_000, withdrawalRate: 0.037, realReturn: 0.035, reserveCents: 600_000, thresholdCents: 10_000 };
  it("bez poplatkov alebo s platnými poplatkami prejde validáciou", () => {
    expect(validateSettings(base, "2026-10-14")).toEqual([]);
    expect(validateSettings({ ...base, feesRate: 0.005 }, "2026-10-14")).toEqual([]);
  });
  it("záporné alebo príliš veľké poplatky sú odmietnuté", () => {
    expect(validateSettings({ ...base, feesRate: -0.01 }, "2026-10-14").length).toBeGreaterThan(0);
    expect(validateSettings({ ...base, feesRate: 1 }, "2026-10-14").length).toBeGreaterThan(0);
  });
});
