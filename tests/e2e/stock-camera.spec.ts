import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Skenovanie kamerou (D-233): falošná kamera prehliadača číta syntetický EAN-13 zo súboru Y4M; kód sa uloží k položke.
test.describe("skenovanie čiarového kódu kamerou", () => {
  test("kamera načíta kód a položka si ho zapamätá", async ({ page }) => {
    test.setTimeout(120_000);
    await openApp(page);
    await goTo(page, "sklad");

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByRole("button", { name: "Skenovať kódom kamerou" }).click();
    await expect(page.getByText(/Čiarový kód 4006381333931 zatiaľ nepoznáme/)).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel("Čiarový kód (nepovinné)")).toHaveValue("4006381333931");

    await page.getByLabel("Názov (napr. mlieko)").fill("Syntetický výrobok kamera");
    await page.getByLabel("Množstvo").fill("1");
    await page.getByLabel("Jednotka").selectOption("ks");
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.getByText("Syntetický výrobok kamera")).toBeVisible();
  });
});
