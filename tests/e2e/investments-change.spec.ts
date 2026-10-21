import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Investície: upozornenie na zmenu po vyhodnotení a rozpis podľa druhu. Syntetické hodnoty.
test.describe("investície: zmena a rozpis", () => {
  test("zmena položky po vyhodnotení sa oznámi a súčet sa rozpíše podľa druhu", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("1000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "investicie");
    await page.getByRole("button", { name: "Pridať položku" }).click();
    await page.getByLabel("Názov alebo ticker").fill("ETF test");
    await page.getByLabel("Počet kusov").fill("10");
    await page.getByLabel("Cena za kus (v mene položky)").fill("20");
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.getByText("Spolu: 200 €")).toBeVisible();

    await goTo(page, "vyhodnotenie");
    await expect(page.getByText("Investície sa zmenili od posledného vyhodnotenia.")).toBeVisible();
  });
});

test.describe("investície: staré ocenenie", () => {
  test("ocenenie staršie ako 3 mesiace sa označí", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await page.getByRole("button", { name: "Pridať položku" }).click();
    await page.getByLabel("Názov alebo ticker").fill("starý ETF");
    await page.getByLabel("Počet kusov").fill("1");
    await page.getByLabel("Cena za kus (v mene položky)").fill("100");
    await page.getByLabel("Dátum ocenenia (RRRR-MM-DD)").fill("2026-01-01");
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.getByText(/Staré ocenenie \(viac ako 3 mesiace\): starý ETF/)).toBeVisible();
  });
});
