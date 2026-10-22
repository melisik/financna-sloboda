import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Moduly a viditeľnosť sekcií (D-162). Syntetické hodnoty.
test.describe("moduly (D-162)", () => {
  test("vypnutý modul sa skryje z navigácie a zostane skrytý po obnovení", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    const moduly = page.getByRole("region", { name: "Moduly" });
    await moduly.getByLabel("Investície", { exact: true }).uncheck();

    await page.getByRole("navigation", { name: "Hlavná navigácia" }).getByRole("button", { name: /^Viac/ }).click();
    await expect(page.locator('#nav-viac a[href="#investicie"]')).toHaveCount(0);
    await expect(page.locator('#nav-viac a[href="#dane"]')).toBeVisible();

    await page.reload();
    await goTo(page, "nastavenia");
    await expect(page.getByRole("region", { name: "Moduly" }).getByLabel("Investície", { exact: true })).not.toBeChecked();
    await page.getByRole("navigation", { name: "Hlavná navigácia" }).getByRole("button", { name: /^Viac/ }).click();
    await expect(page.locator('#nav-viac a[href="#investicie"]')).toHaveCount(0);
  });

  test("jadro (rozpočet, pravidelné výdavky) zostane zapnuté, aj keď sú všetky voliteľné moduly vypnuté", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    const boxes = page.getByRole("region", { name: "Moduly" }).getByRole("checkbox");
    const count = await boxes.count();
    for (let i = 0; i < count; i++) await boxes.nth(i).uncheck();

    await goTo(page, "rozpocet");
    await goTo(page, "pravidelne-vydavky");
    await goTo(page, "vyhodnotenie");
  });

  test("psy a tlačivo 17-dp-md sú v sekcii Dane, nie v Majetku", async ({ page }) => {
    await openApp(page);
    await goTo(page, "dane");
    await expect(page.getByRole("button", { name: "Pridať psa" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Vyplniť tlačivo (PDF)" })).toBeVisible();

    await goTo(page, "majetok");
    await expect(page.locator("section#majetok").getByRole("button", { name: "Pridať psa" })).toHaveCount(0);
    await expect(page.locator("section#majetok").getByRole("button", { name: "Vyplniť tlačivo (PDF)" })).toHaveCount(0);
  });
});
