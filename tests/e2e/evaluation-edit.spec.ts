import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Vyhodnotenie: potvrdenie zmeny nad 50 %, rozpis K a úprava existujúceho vyhodnotenia. Syntetické hodnoty.
test.describe("vyhodnotenie: kontrola a úprava", () => {
  test("veľká zmena sa potvrdí, rozpis je v zozname a vyhodnotenie sa dá upraviť", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "vyhodnotenie");
    await expect(page.getByText("Mesačné vyhodnotenie sa vytvára automaticky.")).toBeVisible();
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("30000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.locator("section#vyhodnotenie div", { hasText: "2026-01-01" }).last()).toContainText("K: 30");

    // Preklep: 3 000 namiesto 30 000 je zmena o 90 %, uloženie sa najprv potvrdí.
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-02-01");
    await page.getByLabel("Hodnota investícií (€)").fill("3000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.getByText("Zmena K je viac ako 50 % oproti poslednému vyhodnoteniu.")).toBeVisible();
    await page.getByRole("button", { name: "Upraviť údaje" }).click();
    await page.getByLabel("Hodnota investícií (€)").fill("31000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.getByText("Zmena K je viac ako 50 %")).toHaveCount(0);
    await expect(page.locator("section#vyhodnotenie div", { hasText: "2026-02-01" }).last()).toContainText("investície 31");

    const feb = page.locator("section#vyhodnotenie div", { hasText: "2026-02-01" }).last();
    await expect(feb).toContainText(/investície 31\D?000 €, hotovosť 0 €/);

    // Úprava: načíta údaje do formulára a prepis ide cez potvrdenie.
    await feb.getByRole("button", { name: "Upraviť", exact: true }).click();
    await expect(page.getByText("Upravuješ vyhodnotenie z 2026-02-01.")).toBeVisible();
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("500");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await page.getByRole("button", { name: "Prepísať vyhodnotenie" }).click();
    await expect(page.getByText("Upravuješ vyhodnotenie z 2026-02-01.")).toHaveCount(0);
    await expect(feb).toContainText("hotovosť 500 €");
  });
});
