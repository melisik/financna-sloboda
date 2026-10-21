import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// FR-02a (Fáza 2, vetva): nájomná nehnuteľnosť v K mení dátum cieľa; syntetické hodnoty.
test.describe("dátum cieľa pri prenájme (FR-02a)", () => {
  test("nájom v K skráti dátum cieľa; vyčerpanie hotovosti sa pomenuje namiesto dátumu", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-10-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    // Východisková hodnota bez nehnuteľnosti.
    await goTo(page, "prehlad");
    const goal = page.locator("section#prehlad p", { hasText: "Dátum cieľa:" });
    await expect(goal).toContainText(/\d{4}/);
    const baselineYear = Number((await goal.textContent())?.match(/(\d{4})/)?.[1]);
    expect(baselineYear).toBeGreaterThan(2026);

    // Nájomný byt: nájom prevyšuje splátku, K_cash rastie a zostatok hypotéky klesá.
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("300000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByLabel("Zostatok hypotéky (€)").fill("200000");
    await page.getByLabel("Mesačný nájom (€, nepovinné)").fill("1200");
    await page.getByLabel("Úroková sadzba hypotéky (% p. a.)").fill("3");
    await page.getByLabel("Mesačná splátka hypotéky (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    await goTo(page, "prehlad");
    const withRental = page.locator("section#prehlad p", { hasText: "Dátum cieľa:" });
    await expect(withRental).toContainText(/\d{4}/);
    const rentalYear = Number((await withRental.textContent())?.match(/(\d{4})/)?.[1]);
    expect(rentalYear).toBeLessThan(baselineYear);

    // Nájom nepokrýva splátku: hotovosť sa vyčerpá v mesiaci 1, dátum sa nezobrazí.
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Upraviť" }).click();
    await page.getByLabel("Mesačný nájom (€, nepovinné)").fill("0");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad p", { hasText: "Dátum cieľa:" })).toContainText("Hotovosť by sa vyčerpala v mesiaci 1; dátum sa nezobrazuje.");
  });
});
