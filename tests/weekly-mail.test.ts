import { describe, expect, it } from "vitest";
import { weeklyMailto, weeklySummaryLines } from "../src/features/prehlad/weeklyMail";
import { weeklySummary } from "../src/domain/weekly";
import type { Transaction } from "../src/storage/types";

// Týždenný súhrn mailom (N-10, D-277). Syntetické hodnoty.
const tx = (id: string, date: string, amountCents: number, category?: string) =>
  ({ id, type: "vydavok", date, amountCents, category, source: "z_hotovosti", createdAt: "", updatedAt: "" }) as unknown as Transaction;

const TODAY = "2026-10-24";

describe("týždenný súhrn mailom (N-10)", () => {
  it("text súhrnu obsahuje súčet, počet a kategórie", () => {
    const s = weeklySummary([tx("a", "2026-10-23", 1250, "jedlo"), tx("b", "2026-10-20", 500, "doprava")], TODAY, 1000);
    const text = weeklySummaryLines(s).join("\n");
    expect(text).toContain("Počet zápisov: 2");
    expect(text).toContain("Nad prahom: 1");
    expect(text).toContain("- jedlo:");
    expect(text).toContain("- doprava:");
  });

  it("prázdny týždeň sa vypíše ako žiadne výdavky", () => {
    const s = weeklySummary([], TODAY, 1000);
    expect(weeklySummaryLines(s).join("\n")).toContain("(žiadne výdavky)");
  });

  it("odkaz mailto nemá príjemcu, obsahuje predmet a text a nemá surové zalomenia", () => {
    const s = weeklySummary([tx("a", "2026-10-23", 1250, "jedlo")], TODAY, 1000);
    const link = weeklyMailto(s);
    expect(link.startsWith("mailto:?subject=")).toBe(true);
    expect(link).not.toContain("\n");
    const body = decodeURIComponent(link.split("&body=")[1]);
    expect(body).toContain("Počet zápisov: 1");
    expect(body).toContain("Výdavky spolu:");
  });
});
