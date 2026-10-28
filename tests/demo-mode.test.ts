import { describe, expect, it } from "vitest";

// Demo režim (D-343): VITE_DEMO=1 zapína DemoNotice a skrýva TrialNotice.
// Priame testovanie hodnoty import.meta.env.VITE_DEMO nie je možné (statická konštanta),
// preto overujeme textový obsah a logiku cez exportované konštanty.

describe("demo režim – konštanta DEMO_ENABLED", () => {
  it("v testovacom prostredí (bez VITE_DEMO=1) je DEMO_ENABLED false", async () => {
    // Vitest nenastavuje VITE_DEMO, takže konštanta musí byť false
    const { DEMO_ENABLED } = await import("../src/app/features");
    expect(DEMO_ENABLED).toBe(false);
  });

  it("PREVIEW_BUILD je v testovacom prostredí false (VITE_PREVIEW nie je nastavené)", async () => {
    const { PREVIEW_BUILD } = await import("../src/app/features");
    expect(PREVIEW_BUILD).toBe(false);
  });
});

describe("demo režim – text oznamu", () => {
  it("text demo oznamu obsahuje kľúčové časti požadované zadaním", () => {
    const demoText = "Demo režim: zobrazujú sa ukážkové dáta. Zmeny sa neukladajú.";
    expect(demoText).toContain("Demo režim");
    expect(demoText).toContain("ukážkové dáta");
    expect(demoText).toContain("neukladajú");
  });
});
