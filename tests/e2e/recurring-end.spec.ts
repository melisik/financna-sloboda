import { expect, test } from "@playwright/test";
import { goTo, localIsoDay, openApp } from "./helpers";

// Pravidelné výdavky: ročný súčet, upozornenie na koniec a ukončenie bez mazania (D-124). Syntetické hodnoty.
const isoDay = localIsoDay;

test.describe("pravidelné výdavky: ročný súčet a ukončenie", () => {
  test("ročný súčet, upozornenie na koniec a ukončenie od zajtra", async ({ page }) => {
    await openApp(page);
    await goTo(page, "pravidelne-vydavky");

    await page.getByRole("button", { name: "Pridať pravidelný výdavok" }).click();
    await page.getByLabel("Názov (napr. predplatné)").fill("Streaming test");
    await page.getByLabel("Kategória pravidelného výdavku").selectOption("predplatné a služby");
    await page.getByLabel("Suma mesačne (€)").fill("12");
    await page.getByLabel("Od", { exact: true }).fill(isoDay(-30));
    await page.getByLabel("Do (nepovinné)").fill(isoDay(10));
    await page.getByRole("button", { name: "Uložiť výdavok" }).click();

    await page.getByRole("button", { name: "Pridať pravidelný výdavok" }).click();
    await page.getByLabel("Názov (napr. predplatné)").fill("Poistka test");
    await page.getByLabel("Kategória pravidelného výdavku").selectOption("iné");
    await page.getByLabel("Frekvencia pravidelného výdavku").selectOption("rocne");
    await page.getByLabel("Suma ročne (€)").fill("120");
    await page.getByLabel("Od", { exact: true }).fill(isoDay(-30));
    await page.getByRole("button", { name: "Uložiť výdavok" }).click();

    await expect(page.getByText("Spolu za mesiac: 22,00 € · za rok: 264,00 €")).toBeVisible();
    const streaming = page.locator("section#pravidelne-vydavky div", { hasText: "Streaming test" }).last();
    await expect(streaming).toContainText("Koniec platnosti o menej ako 30 dní");

    // Ukončiť je v úprave položky (D-293).
    const insurance = page.locator("section#pravidelne-vydavky div", { hasText: "Poistka test" }).last();
    await insurance.getByRole("button", { name: "Upraviť" }).click();
    await page.locator("section#pravidelne-vydavky").getByRole("button", { name: "Ukončiť od zajtra" }).click();
    await expect(insurance).toContainText(`do ${isoDay(0).split("-").reverse().join(".")}`);
    await insurance.getByRole("button", { name: "Upraviť" }).click();
    await expect(page.locator("section#pravidelne-vydavky").getByRole("button", { name: "Ukončiť od zajtra" })).toHaveCount(0);
  });
});
