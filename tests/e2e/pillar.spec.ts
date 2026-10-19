import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-105: tretí pilier v sekcii Investície. Syntetické hodnoty.
test.describe("tretí pilier v Investíciách (D-105)", () => {
  test("stav účtu sa sčíta a vklad sa zobrazí len ako informácia", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await page.getByRole("button", { name: "Pridať položku" }).click();
    await page.getByLabel("Druh").selectOption("treti_pilier");
    await page.getByLabel("Názov účtu").fill("účet syntetický");
    await page.getByLabel("Aktuálny stav účtu (€)").fill("5000");
    await page.getByLabel("Mesačný vklad (€, nepovinné)").fill("100");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await expect(page.getByText("Spolu: 5 000 €")).toBeVisible();
    await expect(page.getByText(/Mesačné vklady do tretieho piliera a iných položiek:\s*100 €/)).toBeVisible();
    await expect(page.locator("#investicie div", { hasText: "účet syntetický" }).last()).toContainText("Stav účtu: 5 000 €");
  });
});
