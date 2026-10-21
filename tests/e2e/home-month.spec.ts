import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Prehľad: plnenie mesačného plánu a rozpis výdavkov na nevyhnutné a nie nevyhnutné (D-131). Syntetické hodnoty.
test.describe("Prehľad: tento mesiac", () => {
  test("plnenie plánu a rozpis podľa nevyhnutnosti", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "rozpocet");
    await page.getByLabel("jedlo: limit (€)").fill("100");
    await page.getByLabel("zábava: limit (€)").fill("50");
    await page.getByRole("button", { name: "Uložiť rozpočet" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.locator("section#vyhodnotenie div", { hasText: "01.01.2026" }).last()).toContainText("K: 30");

    const add = async (amount: string, category?: string) => {
      await goTo(page, "nova-transakcia");
      await page.getByLabel("Suma (€)").fill(amount);
      if (category) await page.getByLabel("Kategória").selectOption(category);
      await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    };
    await add("40", "jedlo");
    await add("30", "zábava");
    await add("10");

    await goTo(page, "prehlad");
    await expect(page.getByText(/Plnenie plánu: 47 %/)).toBeVisible();
    await page.getByText("Rozpis výdavkov", { exact: true }).click();
    await expect(page.getByText(/Nevyhnutné: 40\D?00,00 €|Nevyhnutné: 40,00 €/)).toBeVisible();
    await expect(page.getByText(/Nie nevyhnutné: 30,00 € \(38 % minutého\)/)).toBeVisible();
    await expect(page.getByText(/Ostatné a nezaradené: 10,00 €/)).toBeVisible();
  });
});
