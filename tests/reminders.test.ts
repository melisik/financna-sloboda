import { describe, expect, it } from "vitest";
import { backupOverdue, settingsCheckOverdue, reviewOverdue } from "../src/domain/reminders";

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

describe("pripomienka kontroly nastavení (N-13, D-151)", () => {
  it("bez dátumu kontroly alebo starší ako rok sa pripomenie; čerstvá kontrola nie", () => {
    expect(settingsCheckOverdue(undefined, "2026-10-21")).toBe(true);
    expect(settingsCheckOverdue("2025-10-21T10:00:00.000Z", "2026-10-21")).toBe(false);
    expect(settingsCheckOverdue("2025-10-20T10:00:00.000Z", "2026-10-21")).toBe(true);
    expect(settingsCheckOverdue("2026-10-01T10:00:00.000Z", "2026-10-21")).toBe(false);
  });
});
