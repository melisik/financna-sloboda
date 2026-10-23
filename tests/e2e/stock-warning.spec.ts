import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Upozornenie na blížiacu sa spotrebu (D-237): zbalený súhrn v Prehľade a v Sklade, po rozkliknutí všetky ohrozené položky.
// Lehota je pre každú položku vlastná (D-239). Syntetické hodnoty.
const isoDaysFromNow = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

test.describe("upozornenie na blížiacu sa spotrebu", () => {
  test("položka so spotrebou zajtra sa ukáže ako upozornenie a po rozkliknutí sa zobrazí", async ({ page }) => {
    test.setTimeout(90_000);
    const tomorrow = isoDaysFromNow(1);

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

  test("položka bez upozornenia sa v súhrne neobjaví, kým položka s predvolenou lehotou áno", async ({ page }) => {
    test.setTimeout(90_000);
    const tomorrow = isoDaysFromNow(1);

    await openApp(page);
    await goTo(page, "sklad");
    for (const [name, warn] of [["Syntetický jogurt bez upozornenia", "none"], ["Syntetický jogurt s upozornením", null]] as const) {
      await page.getByRole("button", { name: "Pridať položku skladu" }).click();
      await page.getByLabel("Názov (napr. mlieko)").fill(name);
      await page.getByLabel("Množstvo").fill("1");
      await page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)").fill(tomorrow);
      if (warn !== null) await page.getByLabel("Upozornenie na spotrebu").selectOption(warn);
      await page.getByRole("button", { name: "Uložiť položku" }).click();
      await expect(page.getByText(name, { exact: true })).toBeVisible();
    }

    const summary = page.getByText("Pozor: 1 položka s blížiacou sa alebo prešlou spotrebou");
    await expect(summary).toBeVisible();
    await summary.click();
    await expect(page.getByText("Syntetický jogurt s upozornením: dátum spotreby sa blíži")).toBeVisible();
    await expect(page.getByText("Syntetický jogurt bez upozornenia: dátum spotreby sa blíži")).toHaveCount(0);

    await goTo(page, "prehlad");
    await expect(summary).toBeVisible();
  });

  test("lehota 7 dní upozorní skôr: položka so spotrebou o 5 dní sa ukáže ako upozornenie", async ({ page }) => {
    test.setTimeout(90_000);

    await openApp(page);
    await goTo(page, "sklad");
    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByLabel("Názov (napr. mlieko)").fill("Syntetický jogurt 7 dní");
    await page.getByLabel("Množstvo").fill("1");
    await page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)").fill(isoDaysFromNow(5));
    await page.getByLabel("Upozornenie na spotrebu").selectOption("7");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    const summary = page.getByText("Pozor: 1 položka s blížiacou sa alebo prešlou spotrebou");
    await expect(summary).toBeVisible();
    await summary.click();
    await expect(page.getByText("Syntetický jogurt 7 dní: dátum spotreby sa blíži")).toBeVisible();
  });
});
