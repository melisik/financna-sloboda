import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Ročný prehľad (docs/13, oddiel 4): história K a dátumu cieľa medzi vyhodnoteniami. Syntetické hodnoty.
test.describe("Ročný prehľad", () => {
  test("zobrazí vyhodnotenia, zmenu K a posun dátumu cieľa", async ({ page }) => {
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

    await goTo(page, "rocny-prehlad");
    const first = page.locator("section#rocny-prehlad div", { hasText: "01.01.2026" }).last();
    await expect(first).toContainText(/Kapitál: 300\D?000,00 €/);
    await expect(first).not.toContainText("Zmena kapitálu:");

    const second = page.locator("section#rocny-prehlad div", { hasText: "01.07.2026" }).last();
    await expect(second).toContainText(/Kapitál: 400\D?000,00 €/);
    await expect(second).toContainText(/Zmena kapitálu: \+100\D?000,00 €/);
    await expect(second).toContainText(/Zmena dátumu cieľa: .*skôr/);

    // Auto-vyhodnotenie (D-116) vychádza z najnovšieho ručného stavu 400 000 €, nie zo staršieho 300 000 €.
    const auto = page.locator("section#rocny-prehlad div", { hasText: "automaticky" }).last();
    await expect(auto).toContainText(/Kapitál: 40\d\D?\d{3},\d{2} €/);
  });

  test("prepísanie ručného vyhodnotenia prepočíta auto-riadok (D-116)", async ({ page }) => {
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

    // Prepíšeme 01.07. na 420 000 €; auto-riadok k 30.09. sa musí prepočítať z nového stavu.
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-07-01");
    await page.getByLabel("Hodnota investícií (€)").fill("420000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await page.getByRole("button", { name: "Prepísať vyhodnotenie" }).click();
    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad", { hasText: "Dátum cieľa:" })).toBeVisible();

    await goTo(page, "rocny-prehlad");
    const second = page.locator("section#rocny-prehlad div", { hasText: "01.07.2026" }).last();
    await expect(second).toContainText(/Kapitál: 420\D?000,00 €/);
    const auto = page.locator("section#rocny-prehlad div", { hasText: "automaticky" }).last();
    await expect(auto).toContainText(/Kapitál: 42\d\D?\d{3},\d{2} €/);
  });

  test("bez vyhodnotení sa zobrazí výzva", async ({ page }) => {
    await openApp(page);
    await goTo(page, "rocny-prehlad");
    await expect(page.getByText("Zatiaľ nie sú vyhodnotenia.")).toBeVisible();
  });
});
