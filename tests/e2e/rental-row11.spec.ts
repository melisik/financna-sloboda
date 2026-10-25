import { expect, test } from "@playwright/test";
import { goTo, openApp, openPropertyFolds } from "./helpers";

// Riadok 11 tabuľky 1 (D-158) a údaje pre daň z nehnuteľností. Syntetické hodnoty.
test.describe("podklad pre DP: riadok 11 a údaje nehnuteľnosti", () => {
  test("príjem 1 200 € a výdavky 300 € dajú stĺpec 1 700 € a stĺpec 2 175 €; údaje pre daň sa zobrazia", async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await openPropertyFolds(page); // D-310: bloky formulára sú zbalené
    await page.getByLabel("Názov (nepovinné)").fill("Riadok 11 test");
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("150000");
    await page.getByLabel("Dátum odhadu").fill(today);
    await page.getByLabel("Obec (pre daň z nehnuteľností, nepovinné)").fill("Testovacia obec");
    await page.getByLabel("Číslo parcely (nepovinné)").fill("123/4");
    await page.getByLabel("Podlahová plocha (m², nepovinné)").fill("65");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    const card = page.locator("#majetok div", { hasText: "Riadok 11 test" }).last();
    await expect(card).toContainText("Údaje pre daň: obec Testovacia obec, parcela 123/4, 65 m²");
    await card.getByLabel("Suma (€) – prenájom").fill("1200");
    await card.getByRole("button", { name: "Pridať záznam" }).click();
    await card.getByLabel("Druh záznamu").selectOption("vydavok");
    await card.getByLabel("Suma (€) – prenájom").fill("300");
    await card.getByRole("button", { name: "Pridať záznam" }).click();

    await expect(page.getByText(/riadok 11: stĺpec 1 700,00 €, stĺpec 2 175,00 €/)).toBeVisible({ timeout: 15000 });
  });
});
