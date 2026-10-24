import { describe, expect, it } from "vitest";
import { TRIAL_COLLAPSED_KEY, TRIAL_DETAILS, TRIAL_SUMMARY, readTrialCollapsed, saveTrialCollapsed } from "../src/ui/trialNotice";

// Pruh „Skúšobná verzia“ (D-144, D-281, docs/42): obsah sa nemení, mení sa len to, či je rozbalený.
describe("upozornenie na skúšobnú verziu", () => {
  it("súhrn a podrobnosti spolu obsahujú všetky časti z D-144", () => {
    const text = `${TRIAL_SUMMARY} ${TRIAL_DETAILS}`;
    for (const part of [
      "Skúšobná verzia",
      "len v tomto zariadení",
      "nie sú zašifrované",
      "môžu sa stratiť",
      "zálohu",
      "bez záruky",
      "nie je finančné poradenstvo",
      "Fáza 2 zatiaľ nie je právne posúdená ani bezpečnostne auditovaná",
    ]) expect(text).toContain(part);
  });

  it("zbalený súhrn stále hovorí o skúšobnej verzii, uložení v zariadení a zálohe", () => {
    expect(TRIAL_SUMMARY).toMatch(/^Skúšobná verzia/);
    expect(TRIAL_SUMMARY).toContain("len v tomto zariadení");
    expect(TRIAL_SUMMARY).toContain("zálohu");
  });

  it("kľúč voľby má číslo verzie textu", () => {
    expect(TRIAL_COLLAPSED_KEY).toMatch(/-v\d+$/);
  });

  it("voľba sa pamätá v zariadení; bez uloženej voľby je pruh rozbalený", () => {
    const map = new Map<string, string>();
    const store = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), removeItem: (k: string) => void map.delete(k) };
    expect(readTrialCollapsed(store)).toBe(false);
    saveTrialCollapsed(store, true);
    expect(readTrialCollapsed(store)).toBe(true);
    saveTrialCollapsed(store, false);
    expect(readTrialCollapsed(store)).toBe(false);
  });

  it("bez úložiska je pruh rozbalený a uloženie nezlyhá", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    expect(readTrialCollapsed(broken)).toBe(false);
    expect(readTrialCollapsed(undefined)).toBe(false);
    expect(() => saveTrialCollapsed(broken, true)).not.toThrow();
  });
});
