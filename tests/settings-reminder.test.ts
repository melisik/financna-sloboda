import { describe, expect, it } from "vitest";
import { validateSettings } from "../src/storage/validate";

// D-107: pripomienka vyhodnotenia v Nastaveniach je celé číslo 0 až 28. Syntetické hodnoty.
const base = { expensesCents: 2_400_000, withdrawalRate: 0.04, realReturn: 0.035, reserveCents: 600_000, thresholdCents: 10_000 };

describe("nastavenie pripomienky", () => {
  it("hodnoty 0 až 28 sú platné, mimo rozsah a desatinné číslo nie", () => {
    expect(validateSettings({ ...base, reviewReminderDays: 0 }, "2026-10-19")).toEqual([]);
    expect(validateSettings({ ...base, reviewReminderDays: 28 }, "2026-10-19")).toEqual([]);
    expect(validateSettings({ ...base, reviewReminderDays: 40 }, "2026-10-19").join(" ")).toMatch(/pripomienka/);
    expect(validateSettings({ ...base, reviewReminderDays: 2.5 }, "2026-10-19").join(" ")).toMatch(/pripomienka/);
  });
});
