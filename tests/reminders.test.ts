import { describe, expect, it } from "vitest";
import { backupOverdue, monthEndApproaching, settingsCheckOverdue, reviewOverdue } from "../src/domain/reminders";

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

describe("pripomienka blížiaceho sa konca mesiaca (D-107, okno 3 dni je predpoklad, D-227)", () => {
  it("posledné 3 dni mesiaca bez vyhodnotenia tohto mesiaca: pripomienka", () => {
    expect(monthEndApproaching("2026-09-30", "2026-10-29")).toBe(true);
    expect(monthEndApproaching("2026-09-30", "2026-10-31")).toBe(true);
  });
  it("skôr ako posledné 3 dni: bez pripomienky", () => {
    expect(monthEndApproaching("2026-09-30", "2026-10-28")).toBe(false);
  });
  it("tento mesiac už vyhodnotený: bez pripomienky", () => {
    expect(monthEndApproaching("2026-10-14", "2026-10-30")).toBe(false);
  });
  it("dátum bez časovej zóny: 1. 11. je nový mesiac, nie koniec októbra", () => {
    expect(monthEndApproaching("2026-09-30", "2026-11-01")).toBe(false);
  });
  it("dĺžka mesiaca: február 2026 (28 dní) a február 2028 (priestupný, 29 dní)", () => {
    expect(monthEndApproaching("2026-01-31", "2026-02-25")).toBe(false);
    expect(monthEndApproaching("2026-01-31", "2026-02-26")).toBe(true);
    expect(monthEndApproaching("2027-12-31", "2028-02-26")).toBe(false);
    expect(monthEndApproaching("2027-12-31", "2028-02-27")).toBe(true);
  });
  it("bez vyhodnotenia sa nepripomína (rieši sa výzvou, L6)", () => {
    expect(monthEndApproaching(null, "2026-10-30")).toBe(false);
  });
});
