import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Audit A-04: textové polia majú rovnaký limit dĺžky ako validácia zálohy. Syntetické hodnoty.
test.describe("limity dĺžky textových polí (A-04)", () => {
  test("poznámka transakcie sa zastaví na 200 znakoch", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await expect(page.getByLabel("Poznámka (voliteľná)")).toHaveAttribute("maxlength", "200");
    await page.getByLabel("Poznámka (voliteľná)").fill("a".repeat(250));
    expect((await page.getByLabel("Poznámka (voliteľná)").inputValue()).length).toBe(200);
  });

  test("názov investičnej položky sa zastaví na 80 znakoch", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await page.getByRole("button", { name: "Pridať položku" }).click();
    await expect(page.getByLabel("Názov alebo ticker")).toHaveAttribute("maxlength", "80");
    await page.getByLabel("Názov alebo ticker").fill("b".repeat(120));
    expect((await page.getByLabel("Názov alebo ticker").inputValue()).length).toBe(80);
  });
});
