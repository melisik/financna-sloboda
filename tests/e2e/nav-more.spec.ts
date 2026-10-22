import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

// Všetky viditeľné sekcie sú v hornom paneli naraz; ponuka Viac sa nepoužíva (D-170). Syntetické hodnoty.
test.describe("horný panel: všetky sekcie naraz", () => {
  test("žiadne tlačidlo Viac a všetky sekcie sú v paneli", async ({ page }) => {
    await openApp(page);
    const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
    await expect(nav.getByRole("button", { name: /^Viac/ })).toHaveCount(0);
    for (const label of ["Prehľad", "Transakcie", "Príjmy", "Rozpočet", "Vyhodnotenie", "Majetok", "Záväzky", "Investície", "Pravidelné výdavky", "Dane", "Sklad", "Ročný prehľad", "Nastavenia", "Záloha"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await nav.getByRole("link", { name: "Ročný prehľad", exact: true }).click();
    await expect(page.locator("section#rocny-prehlad")).toBeVisible();
  });
});
