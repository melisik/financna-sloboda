import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Upozornenie na blížiacu sa spotrebu (D-237): zbalený súhrn v Prehľade a v Sklade, po rozkliknutí všetky ohrozené položky.
test.describe("upozornenie na blížiacu sa spotrebu", () => {
  test("položka so spotrebou zajtra sa ukáže ako upozornenie a po rozkliknutí sa zobrazí", async ({ page }) => {
    test.setTimeout(90_000);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    await openApp(page);
    await goTo(page, "sklad");
    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByLabel("Názov (napr. mlieko)").fill("Syntetické mlieko");
    await page.getByLabel("Množstvo").fill("1");
    await page.getByLabel("Jednotka").selectOption("l");
    await page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)").fill(tomorrow);
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    const summary = page.getByText("Pozor: 1 položka s blížiacou sa alebo prešlou spotrebou");
    await expect(summary).toBeVisible();
    await summary.click();
    await expect(page.getByText("Syntetické mlieko: dátum spotreby sa blíži")).toBeVisible();

    await goTo(page, "prehlad");
    await expect(page.getByText("Pozor: 1 položka s blížiacou sa alebo prešlou spotrebou")).toBeVisible();
  });
});
