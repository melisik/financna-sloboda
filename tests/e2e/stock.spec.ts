import { expect, test } from "@playwright/test";
import { goTo, localIsoDay, openApp } from "./helpers";

// Sklad potravín: upozornenia na prešlý a blížiaci sa dátum spotreby. Syntetické hodnoty.
const isoDay = localIsoDay;

test.describe("sklad potravín", () => {
  test("položky s blížiacim sa a prešlým dátumom sa upozornia, po zmazaní zmiznú", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");
    await expect(page.getByText("Zatiaľ nie sú zapísané položky skladu.")).toBeVisible();

    const add = async (name: string, qty: string, unit: string, date: string) => {
      await page.getByRole("button", { name: "Pridať položku skladu" }).click();
      await page.getByLabel("Názov (napr. mlieko)").fill(name);
      await page.getByLabel("Množstvo").fill(qty);
      await page.getByLabel("Jednotka").selectOption(unit);
      await page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)").fill(date);
      await page.getByRole("button", { name: "Uložiť položku" }).click();
    };
    await add("Mlieko", "1", "l", isoDay(1));
    await add("Chlieb", "1", "ks", isoDay(-1));
    await add("Ryža", "500", "g", "");

    const warning = page.locator("section#sklad div", { hasText: "Pozor:" });
    await expect(warning).toContainText("Mlieko: dátum spotreby sa blíži");
    await expect(warning).toContainText("Chlieb: dátum spotreby prešiel");
    await expect(warning).not.toContainText("Ryža");

    const bread = page.locator("section#sklad div", { hasText: "Chlieb" }).last();
    await bread.getByRole("button", { name: "Zmazať", exact: true }).click();
    await bread.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(page.locator("section#sklad div", { hasText: "Pozor:" })).not.toContainText("Chlieb");
    await expect(page.locator("section#sklad div", { hasText: "Pozor:" })).toContainText("Mlieko");
  });

  test("nová položka bez dátumu nedostane dnešný dátum; došlo je na konci a bez upozornenia", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");
    await expect(page.getByText("Názov a dátum môžete doplniť z fotky obalu; množstvo zadajte ručne.")).toBeVisible();

    const add = async (name: string, qty: string, date: string | null) => {
      await page.getByRole("button", { name: "Pridať položku skladu" }).click();
      await page.getByLabel("Názov (napr. mlieko)").fill(name);
      await page.getByLabel("Množstvo").fill(qty);
      await page.getByLabel("Jednotka").selectOption("ks");
      if (date !== null) await page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)").fill(date);
      else await expect(page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)")).toHaveValue("");
      await page.getByRole("button", { name: "Uložiť položku" }).click();
    };
    await add("Mlieko", "1", isoDay(1));
    await add("Soľ", "1", null);
    await add("Cukor", "0", isoDay(-1));

    await expect(page.getByText("Bez dátumu spotreby")).toBeVisible();
    const warning = page.locator("section#sklad div", { hasText: "Pozor:" });
    await expect(warning).toContainText("Mlieko");
    await expect(warning).not.toContainText("Soľ");
    await expect(warning).not.toContainText("Cukor");

    await expect(page.locator("section#sklad section > div > p > strong")).toHaveText(["Mlieko", "Soľ", "Cukor"]);
    await expect(page.locator("section#sklad section > div", { has: page.locator("strong", { hasText: /^Cukor$/ }) })).toContainText("0 ks · došlo");
  });
});
