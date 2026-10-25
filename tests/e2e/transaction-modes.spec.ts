import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, openDetails, TEST_NOW } from "./helpers";

// Formulár transakcie: rýchly výdavok a nákup po položkách (D-313, docs/57). Syntetické dáta.
async function ready(page: Page) {
  await page.clock.setFixedTime(TEST_NOW);
  await openApp(page);
  await goTo(page, "zaloha");
  await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
  await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
  await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
  await goTo(page, "nova-transakcia");
  return page.locator("section#nova-transakcia");
}

async function addItem(t: ReturnType<Page["locator"]>, name: string, qty: string, price: string) {
  await t.getByLabel("Položka", { exact: true }).fill(name);
  await t.getByLabel("Množstvo", { exact: true }).fill(qty);
  await t.getByLabel("Cena za kus (€)").fill(price);
  await t.getByRole("button", { name: "Pridať položku" }).click();
}

test.describe("formulár transakcie (D-313)", () => {
  test("pri nákupe po položkách sa suma nezadáva; zľava je záporná položka", async ({ page }) => {
    const t = await ready(page);
    await t.getByRole("button", { name: "Nákup po položkách" }).click();
    await expect(t.getByLabel("Suma (€)")).toHaveCount(0);
    await addItem(t, "Syntetický chlieb", "2", "1.20");
    await addItem(t, "zľava", "1", "-0.40");
    await expect(t.getByText("Spolu: 2,00 €")).toBeVisible();
    await t.getByRole("button", { name: "Odstrániť položku zľava" }).click();
    await expect(t.getByText("Spolu: 2,40 €")).toBeVisible();
  });

  test("po uložení sa ukáže potvrdenie a z neho sa dá pridať do skladu", async ({ page }) => {
    const t = await ready(page);
    await t.getByRole("button", { name: "Nákup po položkách" }).click();
    await addItem(t, "Syntetický jogurt", "3", "0.50");
    await t.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(t.getByText("Zapísané: výdavok 1,50 €.")).toBeVisible();
    await t.getByRole("button", { name: "Pridať do skladu" }).click();
    await expect(t.getByRole("checkbox", { name: "Syntetický jogurt" })).toBeVisible();
  });

  test("rýchly výdavok má potvrdenie a najnovší záznam dňa je v histórii prvý", async ({ page }) => {
    const t = await ready(page);
    await t.getByLabel("Suma (€)").fill("7.77");
    await t.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(t.getByText("Zapísané: výdavok 7,77 €.")).toBeVisible();
    await t.getByRole("button", { name: "Zobraziť v histórii" }).click();
    await expect(t.locator("#historia-transakcii")).toBeInViewport();
    await expect(t.locator("li", { hasText: "€" }).filter({ has: page.getByRole("button", { name: "Upraviť" }) }).first()).toContainText("7,77 €");
  });

  test("množstvo položky sa mení tlačidlami + a − (prehliadka 2026-10-25, bod 4)", async ({ page }) => {
    const t = await ready(page);
    await t.getByRole("button", { name: "Nákup po položkách" }).click();
    await addItem(t, "Syntetický chlieb", "1", "1.20");
    await expect(t.getByRole("button", { name: "Menej: Syntetický chlieb" })).toBeDisabled();
    await t.getByRole("button", { name: "Viac: Syntetický chlieb" }).click();
    await t.getByRole("button", { name: "Viac: Syntetický chlieb" }).click();
    await expect(t.getByText("Spolu: 3,60 €")).toBeVisible();
    await t.getByRole("button", { name: "Menej: Syntetický chlieb" }).click();
    await expect(t.getByText("Spolu: 2,40 €")).toBeVisible();
  });

  test("bez modulu Sklad potvrdenie povie, kde ho zapnúť", async ({ page }) => {
    const t = await ready(page);
    await goTo(page, "nastavenia");
    await openDetails(page, "section#nastavenia", "Moduly");
    await page.getByRole("region", { name: "Moduly" }).getByLabel("Sklad a recepty", { exact: true }).uncheck();
    await goTo(page, "nova-transakcia");
    await t.getByRole("button", { name: "Nákup po položkách" }).click();
    await addItem(t, "Syntetický jogurt", "1", "0.50");
    await t.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(t.getByText("Položky sa dajú pridať do skladu, keď zapneš modul Sklad.")).toBeVisible();
    await expect(t.getByRole("button", { name: "Pridať do skladu" })).toHaveCount(0);
  });
});
