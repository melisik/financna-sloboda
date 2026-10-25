import { expect, test } from "@playwright/test";
import { goTo, openApp, openFormFolds } from "./helpers";

// D-105: ciele v sekcii Investície zoskupujú položky a ukazujú pokrok. Syntetické hodnoty.
test.describe("ciele v sekcii Investície (D-105)", () => {
  test("cieľ zoskupí položku, ukáže pokrok, pretrvá a zmazanie cieľa položku nezmaže", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");

    await page.getByRole("button", { name: "Pridať cieľ" }).click();
    await page.getByLabel("Názov cieľa").fill("Dovolenka syntetická");
    await page.getByLabel("Cieľová suma (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Dovolenka syntetická · cieľová suma/)).toBeVisible();

    await page.getByRole("button", { name: "Pridať položku" }).click();

    await openFormFolds(page); // D-311
    await page.getByLabel("Názov alebo ticker").fill("ETF cieľový");
    await page.getByLabel("Počet kusov").fill("10");
    await page.getByLabel("Cena za kus (v mene položky)").fill("50");
    await page.getByLabel("Cieľ položky").selectOption({ label: "Dovolenka syntetická" });
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await expect(page.getByText(/Dovolenka syntetická: 500,00 €.*50 % z/)).toBeVisible();

    await page.getByRole("button", { name: "Pridať položku" }).click();

    await openFormFolds(page); // D-311
    await page.getByLabel("Názov alebo ticker").fill("Sporiaci účet syntetický");
    await page.getByLabel("Počet kusov").fill("1");
    await page.getByLabel("Cena za kus (v mene položky)").fill("200");
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.getByText(/Bez cieľa: 200,00 €/)).toBeVisible();

    await page.reload();
    await goTo(page, "investicie");
    await expect(page.getByText(/Dovolenka syntetická: 500,00 €.*50 % z/)).toBeVisible();

    await page.getByRole("button", { name: "Upraviť cieľ", exact: true }).click();
    await page.getByLabel("Názov cieľa").fill("Dovolenka upravená");
    await page.getByLabel("Cieľová suma (€)").fill("2000");
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Dovolenka upravená: 500,00 €.*25 % z/)).toBeVisible();

    await page.getByRole("button", { name: "Zmazať cieľ", exact: true }).click();
    await page.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(page.getByText(/Dovolenka upravená: 500,00 €/)).toHaveCount(0);
    await expect(page.getByText("ETF cieľový")).toBeVisible();
    // Bez cieľov sa skupiny nezobrazujú; súčet položiek zostane 700 €.
    await expect(page.getByText(/Spolu: 700,00 €/)).toBeVisible();
  });
});
