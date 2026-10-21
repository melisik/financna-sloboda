import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-120 + D-048: výdavok nad prahom sa označí aj bez uložených Nastavení (predvolený prah 100 €).
test("výdavok 600 € je označený „nad prahom“, výdavok 10 € nie", async ({ page }) => {
  await openApp(page);
  await goTo(page, "vyhodnotenie");
  await page.getByLabel("Hodnota investícií (€)").fill("100000");
  await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
  await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
  await goTo(page, "nova-transakcia");
  await page.getByLabel("Suma (€)").fill("10");
  await page.getByRole("button", { name: "Uložiť transakciu" }).click();
  await expect(page.getByText("výdavok · 10,00 € (z hotovosti)").first()).toBeVisible();
  await page.getByLabel("Suma (€)").fill("600");
  await page.getByRole("button", { name: "Uložiť transakciu" }).click();
  await expect(page.getByText("výdavok · 600,00 € (z hotovosti) · nad prahom").first()).toBeVisible();
  await expect(page.getByText("výdavok · 10,00 € (z hotovosti) · nad prahom")).toHaveCount(0);
});
