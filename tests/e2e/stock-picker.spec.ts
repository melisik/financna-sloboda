import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Výber predchádzajúceho výrobku pri zadávaní novej položky (D-238). Syntetické hodnoty.
test.describe("výber predchádzajúceho výrobku", () => {
  test("z rozbaľovacieho zoznamu sa doplní názov a jednotka", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByLabel("Názov (napr. mlieko)").fill("Syntetický výrobok výber");
    await page.getByLabel("Množstvo").fill("1");
    await page.getByLabel("Jednotka").selectOption("kg");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByLabel("Predchádzajúce výrobky").selectOption({ label: "Syntetický výrobok výber" });
    await expect(page.getByLabel("Názov (napr. mlieko)")).toHaveValue("Syntetický výrobok výber");
    await expect(page.getByLabel("Jednotka")).toHaveValue("kg");
    await expect(page.getByLabel("Množstvo")).toHaveValue("");
  });

  test("výber predchádzajúceho výrobku prenesie aj lehotu upozornenia", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByLabel("Názov (napr. mlieko)").fill("Syntetický jogurt výber");
    await page.getByLabel("Množstvo").fill("1");
    await page.getByLabel("Upozornenie na spotrebu").selectOption("none");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByLabel("Predchádzajúce výrobky").selectOption({ label: "Syntetický jogurt výber" });
    await expect(page.getByLabel("Upozornenie na spotrebu")).toHaveValue("none");
  });
});
