import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Náhľad vkladu do rezervy (A-16, D-060): text o znížení kapitálu pre cieľ a odmietnutie nad hotovosť. Syntetické hodnoty.
test.describe("vklad do rezervy: náhľad", () => {
  test("náhľad ukáže zníženie kapitálu pre cieľ a vklad nad hotovosť odmietne", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Typ transakcie").selectOption("rezerva");
    await page.getByLabel("Suma (€)").fill("100");
    await expect(page.getByText("Vklad do rezervy zníži kapitál pre cieľ o 100,00 €; peniaze zostávajú v rezerve.")).toBeVisible();

    await page.getByLabel("Suma (€)").fill("2000");
    await expect(page.getByText("Hotovosť nestačí na vklad do rezervy.")).toBeVisible();
  });
});
