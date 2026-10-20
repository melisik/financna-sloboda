import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Daňový rámec (FR-24, FR-25, D-104): režim investície a sekcia Dane bez čísel po dani. Syntetické hodnoty.
test.describe("Dane (FR-24, FR-25)", () => {
  test("investícia sa zaradí do režimu a sekcia Dane ukáže stav overenia", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await page.getByRole("button", { name: "Pridať položku" }).click();
    await page.getByLabel("Názov alebo ticker").fill("ETF – syntetický");
    await page.getByLabel("Počet kusov").fill("10");
    await page.getByLabel("Cena za kus (v mene položky)").fill("100");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await goTo(page, "dane");
    const unset = page.locator("section#dane div", { hasText: "Nezadané" }).last();
    await expect(unset).toContainText(/Hodnota investícií v režime: 1\D?000 €/);
    await expect(unset).toContainText("Zadaj daňový režim");

    await goTo(page, "investicie");
    await page.getByRole("button", { name: "Upraviť" }).click();
    await page.getByLabel("Daňový režim investície").selectOption("zdanene");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await goTo(page, "dane");
    const taxed = page.locator("section#dane div", { hasText: "Zdanené" }).last();
    await expect(taxed).toContainText(/Hodnota investícií v režime: 1\D?000 €/);
    await expect(taxed).toContainText("čaká na overenie pravidiel");
    await expect(page.locator("section#dane")).toContainText("neoverené");
  });
});
