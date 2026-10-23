import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Čiarový kód z fotky obalu (D-232): kód sa načíta offline, známy výrobok doplní názov. Syntetický kód EAN-13.
test.describe("čiarový kód v sklade", () => {
  test("nový kód sa zapamätá a pri ďalšom nákupe doplní názov výrobku", async ({ page }) => {
    test.setTimeout(120_000);
    const photo = path.resolve("tests/fixtures/ean13-synthetic.png");
    await openApp(page);
    await goTo(page, "sklad");

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.locator('input[aria-label="Fotka obalu"]').setInputFiles(photo);
    await expect(page.getByText(/Čiarový kód 4006381333931 zatiaľ nepoznáme/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Čiarový kód (nepovinné)")).toHaveValue("4006381333931");

    await page.getByLabel("Názov (napr. mlieko)").fill("Syntetický výrobok");
    await page.getByLabel("Množstvo").fill("2");
    await page.getByLabel("Jednotka").selectOption("ks");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.locator('input[aria-label="Fotka obalu"]').setInputFiles(photo);
    await expect(page.getByText(/je v sklade ako „Syntetický výrobok“/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Názov (napr. mlieko)")).toHaveValue("Syntetický výrobok");
    await expect(page.getByLabel("Čiarový kód (nepovinné)")).toHaveValue("4006381333931");
  });
});
