import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Prázdny formulár transakcie nemá ukazovať „bez zmeny“, ale výzvu zadať sumu. Syntetické hodnoty.
test.describe("predbežný dopad pri prázdnej sume", () => {
  test("bez sumy výzva, so sumou dopad", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await expect(page.getByText("Zadaj sumu, aby sa ukázal predbežný dopad.")).toBeVisible();
    await expect(page.getByText("bez zmeny")).toHaveCount(0);

    await page.getByLabel("Zdroj úhrady").selectOption("z_investicii");
    await page.getByLabel("Suma (€)").fill("150");
    await expect(page.getByText("Zadaj sumu, aby sa ukázal predbežný dopad.")).toHaveCount(0);
    await expect(page.getByText("Predbežný dopad:")).toBeVisible();
  });
});
