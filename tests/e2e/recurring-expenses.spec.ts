import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Pravidelné výdavky (D-124): súčty za mesiac a podľa kategórie, pretrvanie, zmazanie. Syntetické hodnoty.
test.describe("pravidelné výdavky (D-124)", () => {
  test("mesačné a ročné položky sa sčítajú podľa mesiaca a kategórie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "pravidelne-vydavky");
    await expect(page.getByText("Zatiaľ nie sú zapísané pravidelné výdavky.")).toBeVisible();

    await page.getByRole("button", { name: "Pridať pravidelný výdavok" }).click();
    await page.getByLabel("Názov (napr. predplatné)").fill("Predplatné streamingu");
    await page.getByLabel("Kategória pravidelného výdavku").selectOption("predplatné a služby");
    await page.getByLabel("Suma mesačne (€)").fill("12");
    await page.getByRole("button", { name: "Uložiť výdavok" }).click();

    await page.getByRole("button", { name: "Pridať pravidelný výdavok" }).click();
    await page.getByLabel("Názov (napr. predplatné)").fill("Poistka domácnosti");
    await page.getByLabel("Kategória pravidelného výdavku").selectOption("iné");
    await page.getByLabel("Frekvencia pravidelného výdavku").selectOption("rocne");
    await page.getByLabel("Suma ročne (€)").fill("120");
    await page.getByRole("button", { name: "Uložiť výdavok" }).click();

    await expect(page.getByText("Spolu za mesiac: 22 €")).toBeVisible();
    await expect(page.locator("section#pravidelne-vydavky li", { hasText: "predplatné a služby: 12 €" })).toBeVisible();
    await expect(page.locator("section#pravidelne-vydavky li", { hasText: "iné: 10 €" })).toBeVisible();

    await page.reload();
    await goTo(page, "pravidelne-vydavky");
    await expect(page.getByText("Spolu za mesiac: 22 €")).toBeVisible();

    const card = page.locator("section#pravidelne-vydavky div", { hasText: "Poistka domácnosti" }).last();
    await card.getByRole("button", { name: "Zmazať", exact: true }).click();
    await card.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(page.getByText("Spolu za mesiac: 12 €")).toBeVisible();
  });
});
