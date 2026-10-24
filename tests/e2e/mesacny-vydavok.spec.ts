import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Mesačný výdavok (N-12b, docs/37): zníženie mesačného sporenia bez zápisu. Syntetické hodnoty.
test.describe("mesačný výdavok (scenár)", () => {
  test("bez nastavení a vyhodnotenia ukáže výzvu s tlačidlami", async ({ page }) => {
    await openApp(page);
    await goTo(page, "mesacny-vydavok");
    const section = page.locator("section#mesacny-vydavok");
    await expect(section.getByText("Dopad sa dá vyčísliť až po nastaveniach a vyhodnotení.")).toBeVisible();
    await expect(section.getByRole("link", { name: "Nastavenia" })).toBeVisible();
    await expect(section.getByRole("link", { name: "Vyhodnotenie" })).toBeVisible();
  });

  test("bez mesačného sporenia ukáže vysvetlenie a tlačidlo do Nastavení", async ({ page }) => {
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

    await goTo(page, "mesacny-vydavok");
    const section = page.locator("section#mesacny-vydavok");
    await expect(section.getByText("Mesačné sporenie je 0 €")).toBeVisible();
    await section.getByRole("link", { name: "Nastavenia" }).click();
    await expect(page.getByLabel("Mesačné sporenie do investícií")).toBeVisible();
  });

  test("výpočet ukáže zníženie sporenia a dopad, a nič nezapíše", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByLabel("Mesačné sporenie do investícií").fill("200");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("10000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "mesacny-vydavok");
    await page.getByLabel("Suma mesačne (€)").fill("37");
    await expect(page.getByText(/Mesačné sporenie sa zníži z/)).toBeVisible();
    await expect(page.getByText(/Predbežný dopad:/)).toBeVisible();
    await expect(page.getByText(/Dátum cieľa po zníženom sporení:/)).toBeVisible();

    await goTo(page, "nova-transakcia");
    await expect(page.getByText(/37,00 €/)).toHaveCount(0);
  });

  test("suma nad mesačné sporenie sa nepočíta", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByLabel("Mesačné sporenie do investícií").fill("200");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("10000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "mesacny-vydavok");
    await page.getByLabel("Suma mesačne (€)").fill("1000000");
    await expect(page.getByRole("alert")).toContainText("Výdavok je väčší než mesačné sporenie");
  });
});
