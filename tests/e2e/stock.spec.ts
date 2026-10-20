import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Sklad potravín: upozornenia na prešlý a blížiaci sa dátum spotreby. Syntetické hodnoty.
const isoDay = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

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
      if (date) await page.getByLabel("Dátum spotreby (RRRR-MM-DD, nepovinné)").fill(date);
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
});
