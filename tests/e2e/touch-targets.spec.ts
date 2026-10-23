import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Tlačidlá majú dotykovú plochu aspoň 44 px (D-199). Kontroluje viditeľné tlačidlá na hlavných obrazovkách. Syntetické hodnoty.
test.describe("dotykové plochy tlačidiel (D-199)", () => {
  test("viditeľné tlačidlá na Prehľade, v novej transakcii a v sklade sú aspoň 44 px vysoké", async ({ page }) => {
    await openApp(page);
    for (const id of ["prehlad", "nova-transakcia", "sklad"] as const) {
      await goTo(page, id);
      const buttons = await page.locator(`section#${id} button:visible`).evaluateAll((els) =>
        els.map((el) => ({ text: (el.textContent ?? "").trim(), height: el.getBoundingClientRect().height })),
      );
      expect(buttons.length, `${id}: žiadne tlačidlo sa nenašlo`).toBeGreaterThan(0);
      expect(buttons.filter((b) => b.height < 44), `${id}: tlačidlá pod 44 px`).toEqual([]);
    }
  });
});
