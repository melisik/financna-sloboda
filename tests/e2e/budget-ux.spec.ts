import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Rozpočet: potvrdenie uloženia, súhrn plánu, prekročenie limitu a vysvetlenie prázdneho stavu. Syntetické hodnoty.
test.describe("rozpočet: použiteľnosť", () => {
  test("uloženie, súhrn plánu a prekročenie limitu", async ({ page }) => {
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
    await goTo(page, "rozpocet");
    await expect(page.getByText("Zatiaľ nie je nastavený žiadny limit.")).toBeVisible();

    await page.getByLabel("jedlo: limit (€)").fill("100");
    await page.getByLabel("zábava: limit (€)").fill("50");
    await page.getByRole("button", { name: "Uložiť rozpočet" }).click();
    await expect(page.getByText("Rozpočet je uložený.")).toBeVisible();
    await expect(page.getByText(/Plán spolu: 150,00 €/)).toBeVisible();
    await expect(page.getByText("Zatiaľ nie je nastavený žiadny limit.")).toHaveCount(0);

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Suma (€)").fill("20");
    await page.getByLabel("Kategória").selectOption("jedlo");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await goTo(page, "rozpocet");
    await expect(page.getByText(/Prekročené/)).toHaveCount(0);

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Suma (€)").fill("120");
    await page.getByLabel("Kategória").selectOption("jedlo");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await goTo(page, "rozpocet");
    await expect(page.getByText("Prekročené o 40,00 €.")).toBeVisible();
  });
});
