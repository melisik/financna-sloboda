import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Pravidlo D-121: výdavok zadaný po vyhodnotení v ten istý deň sa odpočíta z investícií. Syntetické hodnoty.
test.describe("transakcia v deň vyhodnotenia (D-121)", () => {
  test("výdavok z investícií zadaný po dnešnom vyhodnotení sa odpočíta", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    // Vyhodnotenie na dnešný dátum (predvolený dátum formulára).
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("310000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad", { hasText: "Posledné vyhodnotenie" })).toBeVisible();

    // Výdavok 150 € z investícií po vyhodnotení.
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Zdroj úhrady").selectOption("z_investicii");
    await page.getByLabel("Suma (€)").fill("150");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("výdavok · 150 €")).toBeVisible();

    await goTo(page, "prehlad");
    await page.getByText("Podrobnosti").click();
    await expect(page.locator("section#prehlad")).toContainText("Kapitál: investície 309 850 €");
  });
});
