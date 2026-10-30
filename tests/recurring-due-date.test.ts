import { describe, expect, it } from "vitest";
import { recurringDueDate } from "../src/domain/calendarObligation";
import type { RecurringExpense } from "../src/storage/types";

const rec = (over: Partial<RecurringExpense> = {}): RecurringExpense => ({
  id: "r1", name: "Nájom", category: "bývanie", frequency: "mesacne", amountCents: 50000, startDate: "2026-01-01",
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", ...over,
});

describe("D-345: deň splatnosti pravidelného výdavku", () => {
  it("31. v 30-dňovom mesiaci padne na 30.; vo februári na 28. a v priestupnom na 29.", () => {
    const e = rec({ dayOfMonth: 31 });
    expect(recurringDueDate(e, "2026-10")).toBe("2026-10-31");
    expect(recurringDueDate(e, "2026-11")).toBe("2026-11-30");
    expect(recurringDueDate(e, "2026-02")).toBe("2026-02-28");
    expect(recurringDueDate(e, "2028-02")).toBe("2028-02-29");
  });
  it("30. vo februári padne na posledný deň, v ostatných mesiacoch ostáva 30.", () => {
    const e = rec({ dayOfMonth: 30 });
    expect(recurringDueDate(e, "2026-02")).toBe("2026-02-28");
    expect(recurringDueDate(e, "2028-02")).toBe("2028-02-29");
    expect(recurringDueDate(e, "2026-04")).toBe("2026-04-30");
    expect(recurringDueDate(e, "2026-10")).toBe("2026-10-30");
  });
  it("29. vo februári nepriestupného roka padne na 28.", () => {
    expect(recurringDueDate(rec({ dayOfMonth: 29 }), "2027-02")).toBe("2027-02-28");
    expect(recurringDueDate(rec({ dayOfMonth: 29 }), "2028-02")).toBe("2028-02-29");
  });
  it("uložený deň sa výpočtom nemení (31 ostáva 31)", () => {
    const e = rec({ dayOfMonth: 31 });
    const before = JSON.stringify(e);
    for (const m of ["2026-02", "2026-04", "2026-06", "2026-09", "2026-11", "2028-02"]) recurringDueDate(e, m);
    expect(JSON.stringify(e)).toBe(before);
    expect(e.dayOfMonth).toBe(31);
  });
  it("starší mesačný záznam bez dayOfMonth sa správa ako doteraz: koniec mesiaca", () => {
    const e = rec();
    expect(e.dayOfMonth).toBeUndefined();
    expect(recurringDueDate(e, "2026-10")).toBe("2026-10-31");
    expect(recurringDueDate(e, "2026-11")).toBe("2026-11-30");
    expect(recurringDueDate(e, "2028-02")).toBe("2028-02-29");
  });
  it("ročný záznam bez dayOfMonth použije deň zo startDate; 29. 2. sa v nepriestupnom roku posunie na 28.", () => {
    expect(recurringDueDate(rec({ frequency: "rocne", startDate: "2024-03-15" }), "2026-03")).toBe("2026-03-15");
    expect(recurringDueDate(rec({ frequency: "rocne", startDate: "2024-02-29" }), "2027-02")).toBe("2027-02-28");
    expect(recurringDueDate(rec({ frequency: "rocne", startDate: "2024-02-29" }), "2028-02")).toBe("2028-02-29");
  });
  it("výslovne zadaný dayOfMonth má prednosť pred startDate", () => {
    expect(recurringDueDate(rec({ frequency: "rocne", startDate: "2024-03-15", dayOfMonth: 5 }), "2026-03")).toBe("2026-03-05");
  });
});
