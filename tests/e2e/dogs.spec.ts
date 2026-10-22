import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Evidencia psov pre daň za psa (D-159). Syntetické hodnoty.
test.describe("evidencia psov", () => {
  test("pridanie psa, počet dnes a pretrvanie po obnovení", async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await openApp(page);
    await goTo(page, "dane");
    await expect(page.getByText("Zatiaľ nie je zapísaný žiadny pes.")).toBeVisible();

    await page.getByRole("button", { name: "Pridať psa" }).click();
    await page.getByLabel("Obec, kde je pes chovaný").fill("Testovacia obec");
    await page.getByLabel("Ulica a číslo domu, kde je pes chovaný").fill("Hlavná 1");
    await page.getByLabel("Miesto držania psa").selectOption("rodinny_dom");
    await page.getByLabel("Účel držania psa").selectOption("domaci");
    await page.getByLabel("Dátum vzniku daňovej povinnosti").fill(today);
    await page.getByLabel("Plemeno (nepovinné)").fill("syntetický pes");
    await page.getByRole("button", { name: "Uložiť psa" }).click();

    await expect(page.getByText("Psov evidovaných dnes: 1")).toBeVisible();
    await expect(page.getByText("Pes bez mena")).toBeVisible();
    await expect(page.getByText(/Hlavná 1, Testovacia obec · rodinný dom · účel domáci/)).toBeVisible();

    await page.reload();
    await goTo(page, "dane");
    await expect(page.getByText("Psov evidovaných dnes: 1")).toBeVisible();
  });
});
