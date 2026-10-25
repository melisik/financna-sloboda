import { expect, test } from "@playwright/test";
import { goTo, openApp, openPropertyFolds } from "./helpers";

// FR-22 (D-265): splátka, ktorá nepokryje nominálny úrok, sa na karte nehnuteľnosti upozorní. Syntetické hodnoty.
test.describe("upozornenie na splátku hypotéky (FR-22, D-265)", () => {
  test("splátka pod nominálnym úrokom sa upozorní, nad úrokom nie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await openPropertyFolds(page); // D-310: bloky formulára sú zbalené
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("300000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByLabel("Zostatok hypotéky (€)").fill("200000");
    await page.getByLabel("Úroková sadzba hypotéky (% p. a.)").fill("3");
    await page.getByLabel("Mesačná splátka hypotéky (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    await expect(page.getByRole("note").filter({ hasText: "nepokrýva nominálny úrok" })).toBeVisible();

    await page.getByRole("button", { name: "Upraviť" }).click();
    await page.getByLabel("Mesačná splátka hypotéky (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();
    await expect(page.getByRole("note").filter({ hasText: "nepokrýva nominálny úrok" })).toHaveCount(0);
  });
});
