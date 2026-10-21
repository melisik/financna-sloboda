import { describe, expect, it } from "vitest";
import { annualRecurringTotalCents, endingSoon, monthlyRecurringTotalCents } from "../src/domain/recurring";
import type { RecurringExpense } from "../src/storage/types";

// Ročný súčet a upozornenie na koniec platnosti (D-124). Syntetické hodnoty.
const TODAY = "2026-10-21";
const base = { category: "iné" as const, createdAt: "x", updatedAt: "x", startDate: "2026-01-01" };
const monthly: RecurringExpense = { ...base, id: "m", name: "Streaming", frequency: "mesacne", amountCents: 1200 };
const yearly: RecurringExpense = { ...base, id: "y", name: "Poistka", frequency: "rocne", amountCents: 12000 };
const ending: RecurringExpense = { ...monthly, id: "e", name: "Koniec čoskoro", endDate: "2026-11-05" };
const ended: RecurringExpense = { ...monthly, id: "x", name: "Ukončený", endDate: "2026-10-01" };

describe("ročný súčet pravidelných výdavkov", () => {
  it("mesačné sa násobia dvanástimi, ročné sa berú ako sú; neplatné sa nerátajú", () => {
    expect(annualRecurringTotalCents([monthly, yearly, ended], TODAY)).toBe(1200 * 12 + 12000);
    expect(annualRecurringTotalCents([], TODAY)).toBe(0);
  });

  it("ročný súčet zodpovedá mesačnému pri mesačných položkách", () => {
    expect(annualRecurringTotalCents([monthly], TODAY)).toBe(monthlyRecurringTotalCents([monthly], TODAY) * 12);
  });
});

describe("koniec platnosti do 30 dní", () => {
  it("upozorní, ak koniec je v najbližších 30 dňoch (vrátane dneška)", () => {
    expect(endingSoon(ending, TODAY)).toBe(true);
    expect(endingSoon({ ...ending, endDate: TODAY }, TODAY)).toBe(true);
  });

  it("bez konca, ďaleko v budúcnosti alebo už skončené sa neupozorní", () => {
    expect(endingSoon(monthly, TODAY)).toBe(false);
    expect(endingSoon({ ...ending, endDate: "2027-06-01" }, TODAY)).toBe(false);
    expect(endingSoon(ended, TODAY)).toBe(false);
  });
});
