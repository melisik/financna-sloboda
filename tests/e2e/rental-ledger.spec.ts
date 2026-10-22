import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Ročná evidencia prenájmu (D-157): záznamy sa sčítajú za rok a úprava nehnuteľnosti ich nesmie stratiť. Syntetické hodnoty.
test.describe("evidencia prenájmu", () => {
  test("záznamy sa sčítajú za rok, zmazanie funguje a úprava nehnuteľnosti ich zachová", async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByLabel("Názov (nepovinné)").fill("Prenájom test");
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("150000");
    await page.getByLabel("Dátum odhadu").fill(today);
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    const card = page.locator("#majetok div", { hasText: "Prenájom test" }).last();
    await card.getByLabel("Suma (€) – prenájom").fill("500");
    await card.getByRole("button", { name: "Pridať záznam" }).click();
    await card.getByLabel("Druh záznamu").selectOption("vydavok");
    await card.getByLabel("Suma (€) – prenájom").fill("80");
    await card.getByLabel("Poznámka (nepovinné)").fill("oprava kúpeľne");
    await card.getByRole("button", { name: "Pridať záznam" }).click();
    await expect(card).toContainText(`Za rok ${today.slice(0, 4)}: prijatý nájom 500,00 €, výdavky 80,00 €, zápisov 2.`);

    // úprava nehnuteľnosti nesmie stratiť záznamy
    await card.getByRole("button", { name: "Upraviť" }).click();
    await page.getByLabel("Odhad hodnoty (€)").fill("151000");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();
    const edited = page.locator("#majetok div", { hasText: "Prenájom test" }).last();
    await expect(edited).toContainText(`prijatý nájom 500,00 €`);

    const expense = edited.locator("li", { hasText: "oprava kúpeľne" });
    await expense.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expense.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(edited).toContainText(`prijatý nájom 500,00 €, výdavky 0,00 €, zápisov 1.`);
  });
});
