import { describe, expect, it } from "vitest";
import { matchingRecurring } from "../src/domain/recurring";
import type { RecurringExpense } from "../src/domain/model/entities";

// Upozornenie na dvojitý zápis pravidelného výdavku (D-299, docs/53: P-B, tolerancia ±1 €). Syntetické hodnoty.
const rec = (name: string, amountCents: number, category: RecurringExpense["category"], frequency: RecurringExpense["frequency"] = "mesacne", startDate = "2026-01-01", endDate?: string): RecurringExpense => ({
  id: name, name, category, frequency, amountCents, startDate, ...(endDate ? { endDate } : {}), createdAt: "2026-01-01T10:00:00Z", updatedAt: "2026-01-01T10:00:00Z",
});
const list = [rec("Nájom", 65_000, "bývanie"), rec("Poistenie", 12_000, "dom a energie", "rocne"), rec("Starý paušál", 3_000, "predplatné a služby", "mesacne", "2025-01-01", "2026-06-30")];

describe("zhoda výdavku s pravidelným výdavkom", () => {
  it("rovnaká kategória a suma v tolerancii ±1 € na dátum výdavku", () => {
    expect(matchingRecurring(list, { date: "2026-10-05", category: "bývanie", amountCents: 65_000 })?.name).toBe("Nájom");
    expect(matchingRecurring(list, { date: "2026-10-05", category: "bývanie", amountCents: 65_100 })?.name).toBe("Nájom");
    expect(matchingRecurring(list, { date: "2026-10-05", category: "bývanie", amountCents: 65_101 })).toBeNull();
  });

  it("iná kategória, bez kategórie, neplatný alebo ukončený pravidelný výdavok nie je zhoda", () => {
    expect(matchingRecurring(list, { date: "2026-10-05", category: "jedlo", amountCents: 65_000 })).toBeNull();
    expect(matchingRecurring(list, { date: "2026-10-05", category: undefined, amountCents: 65_000 })).toBeNull();
    expect(matchingRecurring(list, { date: "2025-12-31", category: "bývanie", amountCents: 65_000 })).toBeNull();
    expect(matchingRecurring(list, { date: "2026-10-05", category: "predplatné a služby", amountCents: 3_000 })).toBeNull();
  });

  it("ročný pravidelný výdavok sa porovnáva s ročnou sumou, nie s mesačným podielom", () => {
    expect(matchingRecurring(list, { date: "2026-10-05", category: "dom a energie", amountCents: 12_000 })?.name).toBe("Poistenie");
    expect(matchingRecurring(list, { date: "2026-10-05", category: "dom a energie", amountCents: 1_000 })).toBeNull();
  });
});
