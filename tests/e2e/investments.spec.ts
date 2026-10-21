import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-101: ručné položky investícií; suma vo Vyhodnotení je súčtom položiek. Syntetické hodnoty.
test.describe("sekcia Investície (D-101)", () => {
  test("položky sa sčítajú, Vyhodnotenie použije súčet a pretrvá po reloade", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await page.getByRole("button", { name: "Pridať položku" }).click();
    await page.getByLabel("Názov alebo ticker").fill("ETF syntetický");
    await page.getByLabel("Počet kusov").fill("10");
    await page.getByLabel("Cena za kus (v mene položky)").fill("50");
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.getByText("Spolu: 500,00 €")).toBeVisible();

    await page.getByRole("button", { name: "Pridať položku" }).click();
    await page.getByLabel("Názov alebo ticker").fill("akcia syntetická USD");
    await page.getByLabel("Počet kusov").fill("2");
    await page.getByLabel("Cena za kus (v mene položky)").fill("100");
    await page.getByLabel("Mena (napr. EUR, USD)").fill("USD");
    await page.getByLabel("Kurz: koľko € za 1 jednotku meny").fill("0.92");
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.getByText("Spolu: 684,00 €")).toBeVisible();

    // Vyhodnotenie: investície sa neupisujú ručne, ale odvodia zo súčtu.
    await goTo(page, "vyhodnotenie");
    await expect(page.getByText("Hodnota investícií: 684,00 €")).toBeVisible();
    await expect(page.getByLabel("Hodnota investícií (€)")).toHaveCount(0);
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("2000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.getByText("Posledné vyhodnotenie:").first()).toBeVisible();

    await page.reload();
    await goTo(page, "investicie");
    await expect(page.getByText("Spolu: 684,00 €")).toBeVisible();
  });
});
