import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import {
  monthIndex,
  addMonths,
  computeShift,
  shiftDates,
} from "../scripts/make-test-backup.mjs";

// ── monthIndex ─────────────────────────────────────────────────────────────

describe("monthIndex", () => {
  it("Jan 2026 = 2026*12+0", () => expect(monthIndex("2026-01-01")).toBe(2026 * 12 + 0));
  it("Nov 2026 = 2026*12+10", () => expect(monthIndex("2026-11-04")).toBe(2026 * 12 + 10));
  it("Dec 2025 = 2025*12+11", () => expect(monthIndex("2025-12-31")).toBe(2025 * 12 + 11));
});

// ── addMonths ───────────────────────────────────────────────────────────────

describe("addMonths", () => {
  it("posunie o +1 mesiac bez zmeny dňa", () =>
    expect(addMonths("2026-10-15", 1)).toBe("2026-11-15"));

  it("posunie o -1 mesiac", () =>
    expect(addMonths("2026-11-15", -1)).toBe("2026-10-15"));

  it("okt 31 + 1 = nov 30 (november má 30 dní)", () =>
    expect(addMonths("2026-10-31", 1)).toBe("2026-11-30"));

  it("jan 31 + 1 = feb 28 (nie prestupný rok)", () =>
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28"));

  it("jan 31 + 1 = feb 29 (prestupný rok 2024)", () =>
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29"));

  it("dec 31 + 1 = jan 31 budúci rok", () =>
    expect(addMonths("2026-12-31", 1)).toBe("2027-01-31"));

  it("mar 31 + 1 = apr 30", () =>
    expect(addMonths("2026-03-31", 1)).toBe("2026-04-30"));

  it("posun o 0 mesiacov – žiadna zmena", () =>
    expect(addMonths("2026-10-15", 0)).toBe("2026-10-15"));

  it("posun o +6 mesiacov (okt→apr)", () =>
    expect(addMonths("2026-10-15", 6)).toBe("2027-04-15"));
});

// ── computeShift ────────────────────────────────────────────────────────────

describe("computeShift", () => {
  it("okt 2026 → nov 2026 = +1", () =>
    expect(computeShift("2026-10-31", "2026-11-04")).toBe(1));

  it("rovnaký mesiac = 0", () =>
    expect(computeShift("2026-11-01", "2026-11-30")).toBe(0));

  it("záporný posun (spätný)", () =>
    expect(computeShift("2026-11-04", "2026-10-31")).toBe(-1));

  it("dlhý posun +6", () =>
    expect(computeShift("2026-05-01", "2026-11-04")).toBe(6));
});

// ── shiftDates ──────────────────────────────────────────────────────────────

describe("shiftDates", () => {
  it("posunie všetky dátumy o +1 mesiac", () => {
    const text = '{"date":"2026-10-15","other":"2026-10-01"}';
    expect(shiftDates(text, 1)).toBe('{"date":"2026-11-15","other":"2026-11-01"}');
  });

  it("shift=0 vráti text nezmenený", () => {
    const text = '{"date":"2026-10-15"}';
    expect(shiftDates(text, 0)).toBe(text);
  });

  it("nerezáva budúce dátumy (expirácia po nasadení)", () => {
    const text = '{"expiryDate":"2026-11-05","deployDate":"2026-11-04"}';
    const result = shiftDates(text, 1);
    // 2026-11-05 → 2026-12-05 (1 mesiac dopredu, NIE orezané na dnešok)
    expect(result).toContain('"2026-12-05"');
    expect(result).toContain('"2026-12-04"');
  });

  it("zachováva budúce termíny záväzkov (dueDate 2027-03-31 → 2027-04-30)", () => {
    const text = '{"dueDate":"2027-03-31"}';
    // shift +1: mar 31 → apr 30 (apr má 30 dní)
    expect(shiftDates(text, 1)).toBe('{"dueDate":"2027-04-30"}');
  });

  it("distribuuje transakcie rôzne po mesiaci (nie všetky na rovnaký deň)", () => {
    const transactions = [
      { date: "2026-10-01" },
      { date: "2026-10-05" },
      { date: "2026-10-10" },
      { date: "2026-10-15" },
      { date: "2026-10-20" },
      { date: "2026-10-25" },
      { date: "2026-10-31" },
    ];
    const text = JSON.stringify(transactions);
    const shifted = JSON.parse(shiftDates(text, 1)) as { date: string }[];
    const dates = shifted.map((t) => t.date);
    // všetky dátumy musia byť v novembri 2026
    expect(dates.every((d) => d.startsWith("2026-11-"))).toBe(true);
    // musia byť rôzne (nie všetky rovnaké)
    const unique = new Set(dates);
    expect(unique.size).toBe(7);
  });

  it("zachováva väzbu calendarObligation ↔ transakcia (rovnaký shift pre obe)", () => {
    const text = JSON.stringify({
      transactions: [{ id: "t1", date: "2026-10-31", calendarObligationId: "co1" }],
      calendarObligations: [{ id: "co1", dueDate: "2026-10-31", paidDate: "2026-10-31" }],
    });
    const result = JSON.parse(shiftDates(text, 1));
    expect(result.transactions[0].date).toBe("2026-11-30");
    expect(result.calendarObligations[0].dueDate).toBe("2026-11-30");
    expect(result.calendarObligations[0].paidDate).toBe("2026-11-30");
  });

  it("snapshotov chronológia zostáva zachovaná po posune", () => {
    const text = JSON.stringify([
      { id: "s1", date: "2026-06-30" },
      { id: "s2", date: "2026-09-30" },
    ]);
    const result = JSON.parse(shiftDates(text, 1)) as { id: string; date: string }[];
    expect(result[0].date < result[1].date).toBe(true);
  });

  it("opakovateľnosť – rovnaký výstup pri rovnakom vstupe a shifte", () => {
    const text = '{"date":"2026-10-15","expiry":"2026-11-05"}';
    expect(shiftDates(text, 1)).toBe(shiftDates(text, 1));
  });
});

// ── integračný test: modelová domácnosť (okt 2026 → nov 2026) ──────────────

describe("modelova-domacnost.json posun okt→nov", () => {
  const raw = readFileSync("public/modelova-domacnost.json", "utf8");
  const source = JSON.parse(raw);
  const shift = computeShift(source.exportedAt.slice(0, 10), "2026-11-04");
  const shifted = JSON.parse(shiftDates(raw, shift));

  it("shift je +1", () => expect(shift).toBe(1));

  it("exportedAt posunuté na november", () =>
    expect(shifted.exportedAt).toMatch(/^2026-11/));

  it("stockItem expirácie sú v budúcnosti voči 2026-11-04", () => {
    const expiries = shifted.stockItems
      .filter((s: { expiryDate?: string }) => s.expiryDate)
      .map((s: { expiryDate: string }) => s.expiryDate);
    expect(expiries.length).toBeGreaterThan(0);
    // všetky expirácie musia byť >= 2026-11-04 (žiadna neorezaná na dnešok)
    expect(expiries.every((d: string) => d >= "2026-11-04")).toBe(true);
  });

  it("calendarObligation co01 dueDate je 2027-04-30", () => {
    const co01 = shifted.calendarObligations.find((c: { id: string }) => c.id === "mdemo-co01");
    expect(co01?.dueDate).toBe("2027-04-30");
  });

  it("calendarObligation co02 dueDate je 2027-01-15", () => {
    const co02 = shifted.calendarObligations.find((c: { id: string }) => c.id === "mdemo-co02");
    expect(co02?.dueDate).toBe("2027-01-15");
  });

  it("transakcie sú distribuované v novembri (nie všetky rovnaký deň)", () => {
    const novTx = shifted.transactions.filter((t: { date: string }) =>
      t.date.startsWith("2026-11-")
    );
    const uniqueDates = new Set(novTx.map((t: { date: string }) => t.date));
    expect(uniqueDates.size).toBeGreaterThan(5);
  });

  it("adresa psa je fiktívna (Vzorová)", () => {
    const dog = shifted.dogs?.[0];
    expect(dog?.address).toContain("Vzorová");
  });
});
