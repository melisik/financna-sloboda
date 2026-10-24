import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Podrobnosti v Prehľade sa ukazujú ako tlačidlo a po kliknutí otvoria riadky. Syntetické hodnoty.
test.describe("tlačidlo Podrobnosti", () => {
  test("je viditeľné ako tlačidlo a otvorí podrobnosti; veta o dani a inflácia zodpovedajú výpočtu", async ({ page }) => {
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

    await goTo(page, "prehlad");
    // Veta o dani je pri dátume cieľa, ku ktorému sa vzťahuje (D-281, docs/42).
    await expect(page.locator("section#prehlad")).toContainText("Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.");
    const control = page.locator("section#prehlad summary", { hasText: "Podrobnosti ▾" });
    await expect(control).toBeVisible();
    await control.click();
    await expect(page.locator("section#prehlad")).toContainText("Kapitál: investície");
    // Text uvádza tú istú infláciu, z ktorej počíta (D-263, D-282).
    await expect(page.locator("section#prehlad")).toContainText("nominálne ≈ 7,8 % pri inflácii 4,2 % (predpoklad)");
  });
});
