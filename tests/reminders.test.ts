import { describe, expect, it } from "vitest";
import { backupOverdue, reviewDueSoon, reviewOverdue } from "../src/app/reminders";

describe("pripomienka vyhodnotenia (FR-10)", () => {
  it("v tom istom mesiaci nie je pripomienka", () => {
    expect(reviewOverdue("2026-10-14", "2026-10-30")).toBe(false);
  });
  it("vyhodnotenie z 31. 10. nie je v 1. 11. oneskorené (R13)", () => {
    expect(reviewOverdue("2026-10-31", "2026-11-01")).toBe(false);
  });
  it("vyhodnotenie z 14. 10. nie je v 1. 11. oneskorené", () => {
    expect(reviewOverdue("2026-10-14", "2026-11-01")).toBe(false);
  });
  it("v ďalšom mesiaci po predchádzajúcom chýba vyhodnotenie", () => {
    expect(reviewOverdue("2026-10-14", "2026-12-01")).toBe(true);
  });
  it("bez vyhodnotenia sa nepripomína (rieši sa výzvou, L6)", () => {
    expect(reviewOverdue(null, "2026-11-01")).toBe(false);
  });
});

describe("pripomienka zálohy (FR-19, D-035)", () => {
  it("nikdy exportované: pripomienka", () => {
    expect(backupOverdue(null, "2026-10-14")).toBe(true);
  });
  it("exportované pred 7 dňami a menej: bez pripomienky", () => {
    expect(backupOverdue("2026-10-08", "2026-10-14")).toBe(false);
  });
  it("exportované pred viac ako 7 dňami: pripomienka", () => {
    expect(backupOverdue("2026-10-06", "2026-10-14")).toBe(true);
  });
});

describe("pripomienka blížiaceho sa konca mesiaca (D-107)", () => {
  it("v posledné tri dni mesiaca, ak vyhodnotenie z tohto mesiaca chýba", () => {
    expect(reviewDueSoon("2026-09-30", "2026-10-28")).toBe(false);
    expect(reviewDueSoon("2026-09-30", "2026-10-29")).toBe(true);
    expect(reviewDueSoon("2026-09-30", "2026-10-30")).toBe(true);
    expect(reviewDueSoon("2026-09-30", "2026-10-31")).toBe(true);
  });

  it("nezobrazí sa, ak je vyhodnotenie z tohto mesiaca alebo ak ešte žiadne nie je", () => {
    expect(reviewDueSoon("2026-10-30", "2026-10-31")).toBe(false);
    expect(reviewDueSoon(null, "2026-10-31")).toBe(false);
  });

  it("v decembri a februári počíta s dĺžkou mesiaca", () => {
    expect(reviewDueSoon("2026-11-30", "2026-12-28")).toBe(false);
    expect(reviewDueSoon("2026-11-30", "2026-12-31")).toBe(true);
    expect(reviewDueSoon("2027-01-31", "2027-02-25")).toBe(false);
    expect(reviewDueSoon("2027-01-31", "2027-02-26")).toBe(true);
  });
});

describe("nastaviteľná pripomienka vyhodnotenia (D-107)", () => {
  it("0 dní vypne pripomienku; zadaný počet dní určuje začiatok", () => {
    expect(reviewDueSoon("2026-09-30", "2026-10-31", 0)).toBe(false);
    expect(reviewDueSoon("2026-09-30", "2026-10-26", 5)).toBe(false);
    expect(reviewDueSoon("2026-09-30", "2026-10-27", 5)).toBe(true);
  });
});

