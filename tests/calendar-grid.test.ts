import { describe, expect, it } from "vitest";
import {
  dayStatus,
  defaultSelectedDate,
  groupByDate,
  isMonth,
  longDateSk,
  monthGrid,
  monthLabelSk,
  obligationCountLabel,
  obligationsForGrid,
  shiftMonth,
  weekdayIndex,
} from "../src/domain/calendarGrid";
import { newObligation } from "../src/domain/calendarObligation";
import type { CalendarObligation, RecurringExpense } from "../src/storage/types";

const ob = (dueDate: string, status: CalendarObligation["status"] = "caka", name = "X"): CalendarObligation => ({
  ...newObligation({ name, category: "bývanie", amountCents: 1000, dueDate }), status,
});
const rec = (over: Partial<RecurringExpense> = {}): RecurringExpense => ({
  id: "r1", name: "Nájom", category: "bývanie", frequency: "mesacne", amountCents: 50000, startDate: "2026-01-01",
  createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", ...over,
});

describe("D-345: mesačná mriežka", () => {
  it("každý riadok má 7 dní od pondelka; dni sú súvislé", () => {
    for (const m of ["2026-02", "2026-10", "2026-11", "2027-01", "2024-02", "2028-02"]) {
      const weeks = monthGrid(m);
      const flat = weeks.flat();
      expect(weeks.every((w) => w.length === 7)).toBe(true);
      expect(flat.map((d) => d.weekday)).toEqual(flat.map((_, i) => i % 7));
      expect(weekdayIndex(weeks[0][0].date)).toBe(0);
      for (let i = 1; i < flat.length; i++) expect(flat[i].date > flat[i - 1].date).toBe(true);
    }
  });

  it("február 2027 začína pondelkom a má 28 dní: presne 4 riadky bez dní iných mesiacov", () => {
    const weeks = monthGrid("2027-02");
    expect(weeks).toHaveLength(4);
    expect(weeks.flat().every((d) => d.inMonth)).toBe(true);
  });

  it("október 2026 (štvrtok, 31 dní) má 5 riadkov; 1. október je vo štvrtom stĺpci", () => {
    const weeks = monthGrid("2026-10");
    expect(weeks).toHaveLength(5);
    expect(weeks[0][3]).toMatchObject({ date: "2026-10-01", inMonth: true, weekday: 3 });
    expect(weeks[0][0]).toMatchObject({ date: "2026-09-28", inMonth: false });
    expect(weeks[4][6]).toMatchObject({ date: "2026-11-01", inMonth: false });
  });

  it("august 2026 (sobota, 31 dní) má 6 riadkov", () => {
    const weeks = monthGrid("2026-08");
    expect(weeks).toHaveLength(6);
    expect(weeks[0][5].date).toBe("2026-08-01");
    expect(weeks.flat().filter((d) => d.inMonth)).toHaveLength(31);
  });

  it("priestupný február 2028 má 29 dní, 2026 má 28", () => {
    expect(monthGrid("2028-02").flat().filter((d) => d.inMonth)).toHaveLength(29);
    expect(monthGrid("2026-02").flat().filter((d) => d.inMonth)).toHaveLength(28);
  });

  it("mriežka decembra sa cez hranicu roka predlžuje do januára", () => {
    const flat = monthGrid("2026-12").flat();
    expect(flat[flat.length - 1].date.startsWith("2027-01")).toBe(true);
    expect(monthGrid("2027-01")[0][0].date.startsWith("2026-12")).toBe(true);
  });
});

describe("D-345: posun mesiaca a platnosť", () => {
  it("prechod medzi rokmi oboma smermi", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftMonth("2026-03", -3)).toBe("2025-12");
    expect(shiftMonth("2026-10", 15)).toBe("2028-01");
  });
  it("isMonth prijme len YYYY-MM", () => {
    expect(isMonth("2026-10")).toBe(true);
    for (const v of ["", "2026-13", "2026-00", "2026-1", "26-10", "2026-10-01", "0999-10", "3000-01"]) expect(isMonth(v)).toBe(false);
  });
  it("popisy po slovensky", () => {
    expect(monthLabelSk("2026-10")).toBe("Október 2026");
    expect(longDateSk("2026-10-30")).toBe("piatok 30. októbra 2026");
    expect(longDateSk("2027-03-01")).toBe("pondelok 1. marca 2027");
    expect([1, 2, 4, 5, 0].map(obligationCountLabel)).toEqual(["povinnosť", "povinnosti", "povinnosti", "povinností", "povinností"]);
  });
});

describe("D-345: povinnosti v mriežke", () => {
  it("viac povinností v jednom dni ostane pokope a stav dňa je najhorší", () => {
    const list = [ob("2026-10-05", "zaplatene", "A"), ob("2026-10-05", "caka", "B"), ob("2026-10-05", "po_splatnosti", "C"), ob("2026-10-06", "zaplatene")];
    const by = groupByDate(list);
    expect(by.get("2026-10-05")).toHaveLength(3);
    expect(dayStatus(by.get("2026-10-05")!)).toBe("po_splatnosti");
    expect(dayStatus(by.get("2026-10-06")!)).toBe("zaplatene");
    expect(dayStatus([])).toBeNull();
    expect(dayStatus([ob("2026-10-05", "zaplatene"), ob("2026-10-05", "caka")])).toBe("caka");
  });

  it("mriežka obsahuje aj povinnosti tlmených dní susedných mesiacov", () => {
    const weeks = monthGrid("2026-10"); // obsahuje 28. 9. – 1. 11.
    const list = obligationsForGrid([], [ob("2026-09-30"), ob("2026-11-01"), ob("2026-10-15"), ob("2026-12-01")], weeks, "2026-10-30");
    expect(list.map((o) => o.dueDate).sort()).toEqual(["2026-09-30", "2026-10-15", "2026-11-01"]);
  });

  it("pravidelná povinnosť sa zobrazí na svojom dni v každom zo zobrazených mesiacov", () => {
    const weeks = monthGrid("2026-10");
    const list = obligationsForGrid([rec({ dayOfMonth: 1 })], [], weeks, "2026-10-30");
    // 1. 9. a 1. 11. ležia mimo zobrazených dní mriežky (28. 9. – 1. 11.), preto sa v mriežke objaví len 1. 11. a 1. 10.
    const inGrid = new Set(weeks.flat().map((d) => d.date));
    expect(list.filter((o) => inGrid.has(o.dueDate)).map((o) => o.dueDate).sort()).toEqual(["2026-10-01", "2026-11-01"]);
  });

  it("predvolený deň: dnešok v zobrazenom mesiaci, inak prvý deň s povinnosťou, inak nič", () => {
    const by = groupByDate([ob("2026-11-20"), ob("2026-11-05"), ob("2026-10-31")]);
    expect(defaultSelectedDate("2026-10", "2026-10-30", by)).toBe("2026-10-30");
    expect(defaultSelectedDate("2026-11", "2026-10-30", by)).toBe("2026-11-05");
    expect(defaultSelectedDate("2026-12", "2026-10-30", by)).toBeNull();
  });
});
