import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Oprava dátumu cieľa: pri nulovom sporení a nízkom výnose sa nesmie zobraziť vzdialený dátum. Syntetické hodnoty.
test.describe("dátum cieľa pri nulovom sporení (oprava)", () => {
  test("nad 50 rokov alebo nedosiahnuteľné sa zobrazí upozornenie, nie dátum", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("1");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia (RRRR-MM-DD)").fill("2026-10-01");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad p", { hasText: "Dátum cieľa:" })).toContainText(/Viac ako 50 rokov|cieľ nedosiahneš|nedosiahne/);
  });
});
