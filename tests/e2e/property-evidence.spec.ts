import { expect, test } from "@playwright/test";
import { goTo, openApp, openPropertyFolds } from "./helpers";

// Evidencia nehnuteľnosti pre dane (D-156): dátumy a obstarávacia cena, bez daňových výpočtov. Syntetické hodnoty.
test.describe("evidencia nehnuteľnosti pre dane", () => {
  test("obstaranie a začiatok prenájmu sa zobrazia na karte", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await openPropertyFolds(page); // D-310: bloky formulára sú zbalené
    await page.getByLabel("Názov (nepovinné)").fill("Byt syntetický");
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("150000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByLabel("Dátum obstarania (nepovinné)").fill("2015-06-01");
    await page.getByLabel("Obstarávacia cena (€, nepovinné)").fill("120000");
    await page.getByLabel("Dátum začiatku prenájmu (nepovinné)").fill("2016-01-01");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    const card = page.locator("#majetok div", { hasText: "Byt syntetický" }).last();
    await expect(card).toContainText("Obstarané 01.06.2015 za 120 000,00 € (evidencia pre dane)");
    await expect(card).toContainText("Prenájom od 01.01.2016");
  });
});
