import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Príjmy: rozdiel príjmu a minutého tento mesiac, upozornenie bez príjmu a názov pri mazaní. Syntetické hodnoty.
test.describe("príjmy: rozdiel a upozornenie", () => {
  test("bez príjmu sa upozorní, po pridaní príjmu sa ukáže rozdiel a zmazanie uvedie názov", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Suma (€)").fill("40");
    await page.getByLabel("Kategória").selectOption("jedlo");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();

    await goTo(page, "prijmy");
    await expect(page.getByText("Nie je zadaný žiadny platný pravidelný príjem.")).toBeVisible();

    await page.getByRole("button", { name: "Pridať pravidelný príjem" }).click();
    await page.getByLabel("Názov (napr. mzda)").fill("Mzda test");
    await page.getByLabel("Suma mesačne (€)").fill("1000");
    await page.getByLabel("Od", { exact: true }).fill("2026-01-01");
    await page.getByRole("button", { name: "Uložiť príjem" }).click();

    await expect(page.getByText("Nie je zadaný žiadny platný pravidelný príjem.")).toHaveCount(0);
    await expect(page.getByText(/Rozdiel: \+960,00 €/)).toBeVisible();

    const card = page.locator("section#prijmy div", { hasText: "Mzda test" }).last();
    await card.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(page.getByText("Naozaj zmazať príjem „Mzda test“?")).toBeVisible();
    await page.getByRole("button", { name: "Zrušiť" }).last().click();
  });
});
