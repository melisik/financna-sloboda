import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Skryté odkazy na ďalší krok (D-206): objavia sa, až keď ich dáta potrebujú. Syntetické hodnoty.
test.describe("prepojenia medzi sekciami", () => {
  test("bez nehnuteľnosti a investícií Dane ponúknu Majetok a Investície", async ({ page }) => {
    await openApp(page);
    await goTo(page, "dane");
    await expect(page.locator('section#dane a[href="#majetok"]')).toBeVisible();
    await expect(page.locator('section#dane a[href="#investicie"]')).toBeVisible();
    await page.locator('section#dane a[href="#investicie"]').click();
    await expect(page.locator("section#investicie")).toBeVisible();
  });

  test("nehnuteľnosť v Majetku ponúkne Dane a z Daní zmizne odkaz na Majetok", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("300000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();
    await expect(page.locator('section#majetok a[href="#dane"]')).toBeVisible();
    await expect(page.locator('section#majetok a[href="#zavazky"]')).toHaveCount(0);
    await page.locator('section#majetok a[href="#dane"]').click();
    await expect(page.locator("section#dane")).toBeVisible();
    await expect(page.locator('section#dane a[href="#majetok"]')).toHaveCount(0);
  });

  test("položka investícií ponúkne Vyhodnotenie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await page.getByRole("button", { name: "Pridať položku" }).click();
    await page.getByLabel("Názov alebo ticker").fill("ETF test");
    await page.getByLabel("Počet kusov").fill("10");
    await page.getByLabel("Cena za kus (v mene položky)").fill("20");
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.locator('section#investicie a[href="#vyhodnotenie"]')).toBeVisible();
    await page.locator('section#investicie a[href="#vyhodnotenie"]').click();
    await expect(page.locator("section#vyhodnotenie")).toBeVisible();
  });

  test("limit v kategórii výdavku ukáže odkaz na Rozpočet", async ({ page }) => {
    await openApp(page);
    await goTo(page, "rozpocet");
    await page.getByLabel("jedlo: limit (€)").fill("300");
    await page.getByRole("button", { name: "Uložiť rozpočet" }).click();
    await goTo(page, "nova-transakcia");
    await expect(page.locator('section#nova-transakcia a[href="#rozpocet"]')).toHaveCount(0);
    await page.getByLabel("Kategória", { exact: true }).selectOption("jedlo");
    await expect(page.locator('section#nova-transakcia a[href="#rozpocet"]')).toBeVisible();
  });

  test("uložené vyhodnotenie ukáže odkaz na Prehľad s dátumom cieľa", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.locator('section#vyhodnotenie a[href="#prehlad"]')).toBeVisible();
    await page.locator('section#vyhodnotenie a[href="#prehlad"]').click();
    await expect(page.locator("section#prehlad")).toBeVisible();
  });
});
