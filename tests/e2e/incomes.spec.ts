import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-102: pravidelné príjmy len zobrazujú. Syntetické hodnoty.
test.describe("sekcia Príjmy (D-102)", () => {
  test("pridanie, súčet za mesiac, pretrvanie po reloade a zmazanie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "prijmy");
    await expect(page.getByText("Zatiaľ nie je zapísaný žiadny pravidelný príjem.")).toBeVisible();

    await page.getByRole("button", { name: "Pridať pravidelný príjem" }).click();
    await page.getByLabel("Názov (napr. mzda)").fill("mzda syntetická");
    await page.getByLabel("Suma mesačne (€)").fill("1200");
    await page.getByLabel("Deň v mesiaci (nepovinné)").fill("15");
    await page.getByLabel("Od", { exact: true }).fill("2025-01-01");
    await page.getByRole("button", { name: "Uložiť príjem" }).click();
    await expect(page.getByText(/Mesačný príjem:\s*1\D*200,00 €/)).toBeVisible();

    // Nepravidelná sociálna dávka: zobrazí sa zvlášť a do mesačného súčtu sa neráta.
    await page.getByRole("button", { name: "Pridať pravidelný príjem" }).click();
    await page.getByLabel("Názov (napr. mzda)").fill("dávka syntetická");
    await page.getByLabel("Druh").selectOption("socialna_davka");
    await page.getByLabel("Frekvencia").selectOption("nepravidelne");
    await page.getByLabel("Suma (€)").fill("300");
    await page.getByLabel("Dátum", { exact: true }).fill("2026-10-05");
    await page.getByRole("button", { name: "Uložiť príjem" }).click();
    await expect(page.getByText(/Mesačný príjem:\s*1\D*200,00 €/)).toBeVisible();
    await expect(page.getByText(/Nepravidelné príjmy[^:]*:\s*300,00 €/)).toBeVisible();

    await page.reload();
    await goTo(page, "prijmy");
    await expect(page.getByText("mzda syntetická")).toBeVisible();

    await page.locator("#prijmy div", { hasText: "mzda syntetická" }).last().getByRole("button", { name: "Zmazať" }).click();
    await page.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await page.locator("#prijmy div", { hasText: "dávka syntetická" }).last().getByRole("button", { name: "Zmazať" }).click();
    await page.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(page.getByText("Zatiaľ nie je zapísaný žiadny pravidelný príjem.")).toBeVisible();
  });
});
