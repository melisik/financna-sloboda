import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Miera výberu na Prehľade je označená ako predpoklad s neovereným zdrojom, rovnako ako výnos (A-05, D-240). Syntetické hodnoty.
test.describe("miera výberu na Prehľade (A-05)", () => {
  test("v podrobnostiach je miera výberu označená ako predpoklad so zdrojom neoveným", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await expect(page.getByText("Nastavenia sú uložené.")).toBeVisible();

    // Podrobnosti na Prehľade sa zobrazia až po prvom vyhodnotení.
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "prehlad");
    await page.locator("section#prehlad summary", { hasText: "Podrobnosti" }).first().click();
    await expect(page.getByText("Miera výberu: 4,0 % (predpoklad, zdroj neoverený).")).toBeVisible();
  });
});
