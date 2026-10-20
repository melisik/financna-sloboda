import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

// Menej používané sekcie sú v ponuke „Viac“; primárne ostávajú v paneli. Syntetické hodnoty.
test.describe("ponuka Viac v hornom paneli", () => {
  test("primárne sekcie sú v paneli, ostatné v ponuke Viac", async ({ page }) => {
    await openApp(page);
    const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
    for (const label of ["Prehľad", "Transakcie", "Vyhodnotenie", "Majetok", "Nastavenia", "Záloha"]) {
      await expect(nav.getByRole("link", { name: label, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole("link", { name: "Ročný prehľad" })).toHaveCount(0);

    await nav.getByRole("button", { name: /^Viac/ }).click();
    await expect(page.locator("#nav-viac")).toBeVisible();
    await page.locator("#nav-viac").getByRole("link", { name: "Ročný prehľad" }).click();
    await expect(page.locator("section#rocny-prehlad")).toBeVisible();
    await expect(page.locator("#nav-viac")).toHaveCount(0);
    await expect(nav.getByRole("button", { name: /^Viac/ })).toHaveAttribute("aria-expanded", "false");
  });
});
