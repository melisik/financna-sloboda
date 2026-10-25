import { expect, test } from "@playwright/test";
import { goTo, openApp, openDetails } from "./helpers";

// Moduly a viditeľnosť sekcií (D-162). Syntetické hodnoty.
test.describe("moduly (D-162)", () => {
  test("vypnutý modul sa skryje z navigácie a zostane skrytý po obnovení", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await openDetails(page, "section#nastavenia", "Moduly"); // D-293: Moduly v Nastaveniach sú zbalené
    const moduly = page.getByRole("region", { name: "Moduly" });
    await moduly.getByLabel("Investície", { exact: true }).uncheck();

    const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
    await expect(nav.locator('a[href="#investicie"]')).toHaveCount(0);
    await expect(nav.getByRole("button", { name: "Majetok a zásoby", exact: true })).toBeVisible();

    await page.reload();
    await goTo(page, "nastavenia");
    await openDetails(page, "section#nastavenia", "Moduly"); // D-293: Moduly v Nastaveniach sú zbalené
    await expect(page.getByRole("region", { name: "Moduly" }).getByLabel("Investície", { exact: true })).not.toBeChecked();
    await expect(page.getByRole("navigation", { name: "Hlavná navigácia" }).locator('a[href="#investicie"]')).toHaveCount(0);
  });

  test("jadro (rozpočet, pravidelné výdavky) zostane zapnuté, aj keď sú všetky voliteľné moduly vypnuté", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await openDetails(page, "section#nastavenia", "Moduly"); // D-293: Moduly v Nastaveniach sú zbalené
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

  test("moduly sú v Prehľade vpravo na širokej obrazovke; na telefóne zbalené pod obsahom a rozbalia sa ťuknutím (D-164, D-283)", async ({ page }) => {
    await openApp(page);
    const moduly = page.getByRole("region", { name: "Moduly" });
    const navod = await page.locator("section#prehlad details#navod").boundingBox();
    const width = page.viewportSize()?.width ?? 0;
    if (width >= 700) {
      await expect(moduly).toBeVisible();
      const box = await moduly.boundingBox();
      expect(box!.x).toBeGreaterThan(navod!.x + navod!.width - 1);
    } else {
      const summary = page.locator("section#prehlad summary", { hasText: "Moduly" });
      await expect(summary).toBeVisible();
      await expect(moduly).toBeHidden();
      expect((await summary.boundingBox())!.y).toBeGreaterThan(navod!.y);
      await summary.click();
      await expect(moduly.getByRole("checkbox").first()).toBeVisible();
    }
  });
});
