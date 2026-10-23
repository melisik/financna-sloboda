import { expect, test } from "@playwright/test";
import { goTo, localIsoDay, openApp } from "./helpers";

// Zabudnutý výdavok s dátumom pred vyhodnotením sa odpočíta z Kapitálu (D-123). Syntetické hodnoty.
test.describe("zabudnutý výdavok (D-123)", () => {
  test("výdavok s včerajším dátumom zadaný po vyhodnotení sa odpočíta", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("310000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    // Výdavok z investícií za včerajší deň, zadaný až teraz.
    const yesterday = localIsoDay(-1);
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Dátum", { exact: true }).fill(yesterday);
    await page.getByLabel("Zdroj úhrady").selectOption("z_investicii");
    await page.getByLabel("Suma (€)").fill("150");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("výdavok · 150,00 €")).toBeVisible();

    await goTo(page, "prehlad");
    await page.getByText("Podrobnosti").click();
    await expect(page.locator("section#prehlad")).toContainText("Kapitál: investície 309 850,00 €");
  });
});
