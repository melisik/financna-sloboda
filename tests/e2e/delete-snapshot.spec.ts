import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Zoznam uložených vyhodnotení a zmazanie po potvrdení. Syntetické hodnoty.
test.describe("uložené vyhodnotenia", () => {
  test("vyhodnotenie sa zobrazí v zozname a zmaže sa po potvrdení", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.locator("section#vyhodnotenie strong", { hasText: "2026-01-01" })).toHaveCount(1);

    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-07-01");
    await page.getByLabel("Hodnota investícií (€)").fill("400000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.locator("section#vyhodnotenie strong", { hasText: "2026-07-01" })).toHaveCount(1);

    const card = page.locator("section#vyhodnotenie div", { hasText: "2026-07-01" }).last();
    await card.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(card).toContainText("Naozaj zmazať vyhodnotenie z 2026-07-01?");
    await page.getByRole("button", { name: "Zmazať vyhodnotenie" }).click();
    await expect(page.locator("section#vyhodnotenie strong", { hasText: "2026-07-01" })).toHaveCount(0);
    await expect(page.locator("section#vyhodnotenie strong", { hasText: "2026-01-01" })).toHaveCount(1);
  });
});
