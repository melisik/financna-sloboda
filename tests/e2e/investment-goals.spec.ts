import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, openFormFolds } from "./helpers";

// Ciele investícií: výber položiek pri tvorbe cieľa a pokrok na Prehľade (D-331). Syntetické hodnoty.
async function addPosition(page: Page, name: string, qty: string, price: string) {
  await page.getByRole("button", { name: "Pridať položku" }).click();
  await openFormFolds(page);
  await page.getByLabel("Názov alebo ticker").fill(name);
  await page.getByLabel("Počet kusov").fill(qty);
  await page.getByLabel("Cena za kus (v mene položky)").fill(price);
  await page.getByRole("button", { name: "Uložiť položku" }).click();
}

test.describe("ciele investícií (D-331)", () => {
  test("cieľ sa vytvorí s položkami hneď a pokrok je na Prehľade", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page, "ETF syntetický", "10", "50");
    await addPosition(page, "Fond syntetický", "5", "100");

    await page.getByRole("button", { name: "Pridať cieľ" }).click();
    await page.getByLabel("Názov cieľa").fill("Dôchodok");
    await page.getByLabel("Cieľová suma (€)").fill("2000");
    await page.getByRole("checkbox", { name: /ETF syntetický/ }).check();
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Dôchodok: 500,00 € · 25 % z 2\s000,00 €/)).toBeVisible();

    await goTo(page, "prehlad");
    await expect(page.getByText("Ciele investícií")).toBeVisible();
    await expect(page.getByText(/Dôchodok: 500,00 € z 2\s000,00 € · 25 %/)).toBeVisible();
    await page.getByRole("link", { name: "Investície" }).first().click();
    await expect(page.locator("#investicie")).toBeVisible();
  });

  test("úprava cieľa pridá a odoberie položky; presun z iného cieľa je označený", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page, "ETF syntetický", "10", "50");
    await addPosition(page, "Fond syntetický", "5", "100");
    for (const [n, sum, pos] of [["Cieľ A", "1000", /ETF syntetický/], ["Cieľ B", "1000", /Fond syntetický/]] as const) {
      await page.getByRole("button", { name: "Pridať cieľ" }).click();
      await page.getByLabel("Názov cieľa").fill(n);
      await page.getByLabel("Cieľová suma (€)").fill(sum);
      await page.getByRole("checkbox", { name: pos }).check();
      await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    }
    await page.getByRole("button", { name: "Upraviť cieľ" }).first().click();
    await expect(page.getByText("teraz v cieli „Cieľ B“, presunie sa")).toBeVisible();
    await page.getByRole("checkbox", { name: /ETF syntetický/ }).uncheck();
    await page.getByRole("checkbox", { name: /Fond syntetický/ }).check();
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Cieľ A: 500,00 € · 50 % z 1\s000,00 €/)).toBeVisible();
    await expect(page.getByText(/Bez cieľa: 500,00 €/)).toBeVisible();
  });

  test("bez cieľov Prehľad blok nemá", async ({ page }) => {
    await openApp(page);
    await expect(page.getByText("Ciele investícií")).toHaveCount(0);
  });
});
