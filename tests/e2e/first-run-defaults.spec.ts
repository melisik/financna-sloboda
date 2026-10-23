import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Pri prvom spustení sú polia nastavení prázdne a odporúčaná hodnota je len nápoveda pod poľom, nie predvyplnenie (D-057). Syntetické hodnoty.
test.describe("prvé spustenie: polia bez predvyplnenia (D-057)", () => {
  test("miera výberu a výnos sú prázdne a východisková hodnota sa ukáže iba ako nápoveda", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await expect(page.getByLabel("Miera výberu (%)")).toHaveValue("");
    await expect(page.getByLabel("Reálny výnos r (%)")).toHaveValue("");
    await expect(page.getByText(/východisková hodnota 3,7 %/)).toBeVisible();
  });
});
