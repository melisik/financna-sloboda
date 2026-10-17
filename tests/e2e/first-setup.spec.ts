import { expect, test } from "@playwright/test";

// FR-12: prvé spustenie ide cez sprievodcu s dvoma krokmi; každý krok sa dá preskočiť.
test.describe("sprievodca prvým nastavením (FR-12)", () => {
  test("prvé spustenie ukáže krok 1, Ďalej/Späť prepínajú a preskočenie vedie na hlavnú stránku", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Krok 1 z 2: cieľ a prah" })).toBeVisible();
    await page.getByRole("button", { name: "Ďalej" }).click();
    await expect(page.getByRole("heading", { name: "Krok 2 z 2: investície a prvé vyhodnotenie" })).toBeVisible();
    await page.getByRole("button", { name: "Späť" }).click();
    await expect(page.getByRole("heading", { name: "Krok 1 z 2: cieľ a prah" })).toBeVisible();
    await page.getByRole("button", { name: "Preskočiť na hlavnú stránku" }).click();
    await expect(page.getByRole("navigation", { name: "Hlavná navigácia" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prehľad" })).toBeVisible();
    await expect(page.getByLabel("Ročné výdavky pri nezávislosti (€)")).toBeVisible();
  });
});
