import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Dve dávky toho istého výrobku s rôznym dátumom spotreby sa zobrazia ako jedna skupina; dávky sa rozkliknú (D-236). Syntetický EAN-13.
test.describe("dávky toho istého výrobku", () => {
  test("rovnaký čiarový kód s iným dátumom je jedna skupina a prvá dávka na spotrebu je označená", async ({ page }) => {
    test.setTimeout(120_000);
    const photo = path.resolve("tests/fixtures/ean13-synthetic.png");
    await openApp(page);
    await goTo(page, "sklad");

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.locator('input[aria-label="Fotka obalu"]').setInputFiles(photo);
    await expect(page.getByText(/Čiarový kód 4006381333931 zatiaľ nepoznáme/)).toBeVisible({ timeout: 60_000 });
    await page.getByLabel("Názov (napr. mlieko)").fill("Syntetický výrobok dávky");
    await page.getByLabel("Množstvo").fill("2");
    await page.getByLabel("Jednotka").selectOption("ks");
    await page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)").fill("2027-03-15");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.locator('input[aria-label="Fotka obalu"]').setInputFiles(photo);
    await expect(page.getByText(/je v sklade ako „Syntetický výrobok dávky“/)).toBeVisible({ timeout: 60_000 });
    await page.getByLabel("Množstvo").fill("3");
    await page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)").fill("2027-06-01");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await expect(page.getByText("Spolu 5 ks · 2 dávky")).toBeVisible();
    await page.getByText("Dávky a dátumy").click();
    await expect(page.getByText("Spotrebovať do 15.03.2027")).toBeVisible();
    await expect(page.getByText("Spotrebovať do 01.06.2027")).toBeVisible();
    await expect(page.getByText("Použiť ako prvé")).toHaveCount(1);
  });
});
