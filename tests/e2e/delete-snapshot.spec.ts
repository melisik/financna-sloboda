import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Zmazanie uloženého vyhodnotenia (ručného). Syntetické hodnoty.
test.describe("zmazanie vyhodnotenia", () => {
  test("ručné vyhodnotenie sa zmaže s potvrdením a zmizne z Ročného prehľadu", async ({ page }) => {
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
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad", { hasText: "Dátum cieľa:" })).toBeVisible();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-07-01");
    await page.getByLabel("Hodnota investícií (€)").fill("400000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad", { hasText: "Dátum cieľa:" })).toBeVisible();

    // Zmazanie 01.07. len po potvrdení.
    await goTo(page, "vyhodnotenie");
    const card = page.locator("section#vyhodnotenie div", { hasText: "2026-07-01" }).last();
    await card.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(card).toContainText("Naozaj zmazať vyhodnotenie z 2026-07-01?");
    await page.getByRole("button", { name: "Zmazať vyhodnotenie" }).click();
    await expect(page.locator("section#vyhodnotenie strong", { hasText: "2026-07-01" })).toHaveCount(0);
    await expect(page.locator("section#vyhodnotenie strong", { hasText: "2026-01-01" })).toHaveCount(1);

    await goTo(page, "rocny-prehlad");
    await expect(page.locator("section#rocny-prehlad strong", { hasText: "2026-07-01" })).toHaveCount(0);
    await expect(page.locator("section#rocny-prehlad strong", { hasText: "2026-01-01" })).toHaveCount(1);
  });

  test("automatické vyhodnotenie sa nedá zmazať tlačidlom", async ({ page }) => {
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
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad", { hasText: "Dátum cieľa:" })).toBeVisible();

    // Auto-riadok vznikne za posledný ukončený mesiac; nemá tlačidlo Zmazať.
    await goTo(page, "vyhodnotenie");
    const auto = page.locator("section#vyhodnotenie div", { hasText: "automaticky" }).last();
    await expect(auto).toContainText("Automatické vyhodnotenie sa vytvorí znova");
    await expect(auto.getByRole("button", { name: "Zmazať", exact: true })).toHaveCount(0);
  });
});
