import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Výhľad (docs/14, D-154): budúci dôchodok sa zobrazí len ako údaj, bez zmeny mesačného príjmu. Syntetické hodnoty.
test.describe("výhľad príjmov", () => {
  test("budúci starobný dôchodok sa ukáže vo výhľade a nezmení mesačný príjem", async ({ page }) => {
    await openApp(page);
    await goTo(page, "prijmy");
    await expect(page.getByText("Zatiaľ nie je zadaný žiadny budúci dôchodok ani dávka.")).toBeVisible();

    await page.getByRole("button", { name: "Pridať pravidelný príjem" }).click();
    await page.getByLabel("Názov (napr. mzda)").fill("dôchodok syntetický");
    await page.getByLabel("Druh").selectOption("starobny_dochodok");
    await page.getByLabel("Suma mesačne (€)").fill("800");
    await page.getByLabel("Od", { exact: true }).fill("2031-03-01");
    await page.getByRole("button", { name: "Uložiť príjem" }).click();

    await expect(page.getByText("Od 01.03.2031: Starobný dôchodok 800,00 € mesačne (dôchodok syntetický)")).toBeVisible();
    await expect(page.getByText(/Mesačný príjem:\s*0,00 €/)).toBeVisible();
    await expect(page.getByText("Appka nič neodhaduje a dátum cieľa sa podľa toho nemení.")).toBeVisible();
  });
});
