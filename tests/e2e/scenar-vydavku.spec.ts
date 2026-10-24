import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Scenár veľkého výdavku (N-12, docs/36): dopad bez zápisu do transakcií. Syntetické hodnoty.
test.describe("scenár veľkého výdavku", () => {
  test("ukáže dopad a dátumy bez výdavku a s výdavkom, a nevytvorí transakciu", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("10000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "scenar-vydavku");
    await page.getByLabel("Suma (€)").fill("5000");
    await expect(page.getByText(/Predbežný dopad:/)).toBeVisible();
    await expect(page.getByText(/Dátum cieľa bez výdavku:/)).toBeVisible();
    await expect(page.getByText(/Dátum cieľa s výdavkom:/)).toBeVisible();
    await expect(page.getByText(/nie je finančným poradenstvom/)).toBeVisible();

    // Scenár nesmie vytvoriť transakciu: na obrazovke Transakcie suma nie je.
    await goTo(page, "nova-transakcia");
    await expect(page.getByText(/5\D?000,00 €/)).toHaveCount(0);
  });

  test("bez nastavení a vyhodnotenia tlačidlá otvoria príslušnú sekciu", async ({ page }) => {
    await openApp(page);
    await goTo(page, "scenar-vydavku");
    const scenario = page.locator("section#scenar-vydavku");
    await expect(scenario.getByText("Dopad sa dá vyčísliť až po nastaveniach a vyhodnotení.")).toBeVisible();
    await scenario.getByRole("link", { name: "Nastavenia" }).click();
    await expect(page.getByLabel("Ročné výdavky pri nezávislosti (€)")).toBeVisible();

    await goTo(page, "scenar-vydavku");
    await scenario.getByRole("link", { name: "Vyhodnotenie" }).click();
    await expect(page.getByLabel("Dátum vyhodnotenia", { exact: true })).toBeVisible();
  });

  test("výdavok väčší než hotovosť ukáže vysvetlenie a zdroj z investícií", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "scenar-vydavku");
    await page.getByLabel("Suma (€)").fill("5000");
    await expect(page.getByRole("alert")).toContainText("Hotovosti nestačí");
    await page.getByLabel("Zdroj").selectOption("z_investicii");
    await expect(page.getByText(/Predbežný dopad:/)).toBeVisible();
  });
});
