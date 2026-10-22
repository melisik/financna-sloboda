import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Sprievodca spustený z Nastavení: nemaže dáta, predvyplní ich a dá sa zavrieť.
test.describe("sprievodca znova z Nastavení", () => {
  test("prejde kroky, uloží nové údaje a vráti sa do Nastavení", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByRole("button", { name: "Spustiť sprievodcu znova" }).click();
    await expect(page.getByRole("heading", { name: "Vitaj" })).toBeVisible();
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("30000");
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await page.getByRole("button", { name: /Nechať \d+,\d %/ }).click();
    await page.getByLabel("Hodnota investícií (€)").fill("50000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť a zobraziť dátum" }).click();
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await expect(page.getByRole("heading", { name: "Hotovo" })).toBeVisible();
    await page.getByRole("button", { name: "Zavrieť" }).click();

    await expect(page.locator("section#nastavenia")).toBeVisible();
    await expect(page.getByLabel("Ročné výdavky pri nezávislosti (€)")).toHaveValue("30000");
  });
});
