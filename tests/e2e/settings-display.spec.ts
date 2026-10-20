import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Zobrazenie uložených percent v Nastaveniach bez binárnych zvyškov (3,5 nie 3,5000000000000004). Syntetické hodnoty.
test.describe("zobrazenie percent v Nastaveniach", () => {
  test("uložené výnos a miera výberu sa zobrazia ako zadané", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("3.7");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await page.reload();
    await openApp(page);
    await goTo(page, "nastavenia");
    await expect(page.getByLabel("Miera výberu (%)")).toHaveValue("3.7");
    await expect(page.getByLabel("Reálny výnos r (%)")).toHaveValue("3.5");
  });
});
