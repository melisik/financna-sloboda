import { describe, expect, it } from "vitest";
import { backupOverdue, reviewOverdue } from "../src/app/reminders";

describe("pripomienka vyhodnotenia (FR-10)", () => {
  it("v tom istom mesiaci nie je pripomienka", () => {
    expect(reviewOverdue("2026-10-14", "2026-10-30")).toBe(false);
  });
  it("v ďalšom mesiaci chýba vyhodnotenie", () => {
    expect(reviewOverdue("2026-10-14", "2026-11-01")).toBe(true);
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
