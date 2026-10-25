import { expect, test } from "@playwright/test";
import { goTo, openApp, openBudgetLimits } from "./helpers";

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
    await expect(page.getByText("Plán ešte nie je nastavený.")).toBeVisible(); // D-293

    await openBudgetLimits(page); // D-293: limity až po „Upraviť limity“

    await page.getByLabel("jedlo: limit (€)").fill("100");
    await openBudgetLimits(page); // D-293: limity až po „Upraviť limity“
    await page.getByLabel("zábava: limit (€)").fill("50");
    await page.getByRole("button", { name: "Uložiť rozpočet" }).click();
    await expect(page.getByText("Rozpočet je uložený.")).toBeVisible();
    await expect(page.getByText(/z plánu 150,00\s€/)).toBeVisible(); // D-293: súhrn „Minuté … z plánu …“
    await expect(page.getByText("Plán ešte nie je nastavený.")).toHaveCount(0);

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
    await expect(page.locator("section#rozpocet p", { hasText: "prekročené o 40,00 €" })).toBeVisible(); // D-293: prehľad bez polí
  });
});
