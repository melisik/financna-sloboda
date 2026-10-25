import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, TEST_NOW } from "./helpers";

// Zrozumiteľnosť po prehliadke zakladateľa (D-308, docs/55). Syntetické dáta.
async function withBackup(page: Page) {
  await page.clock.setFixedTime(TEST_NOW);
  await openApp(page);
  await goTo(page, "zaloha");
  await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
  await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
  await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
}

test.describe("zrozumiteľnosť (docs/55)", () => {
  test("ručne pridaná položka dokladu sa uloží a dá sa pridať do skladu", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const t = page.locator("section#nova-transakcia");
    await t.getByLabel("Suma (€)").fill("3");
    await t.locator("summary", { hasText: "Doklad" }).click();
    await t.getByLabel("Položka ručne: názov").fill("Syntetický jogurt");
    await t.getByLabel("Množstvo položky").fill("2");
    await t.getByLabel("Suma položky (€)").fill("3");
    await t.getByRole("button", { name: "Pridať položku ručne" }).click();
    await expect(t.getByText(/Syntetický jogurt: 2 ks/)).toBeVisible();
    await t.getByRole("button", { name: "Uložiť transakciu" }).click();
    await t.locator("li", { hasText: "3,00" }).getByRole("button", { name: "Upraviť" }).first().click();
    await t.getByRole("button", { name: "Pridať do skladu" }).click();
    await expect(t.getByRole("checkbox", { name: "Syntetický jogurt" })).toBeVisible();
  });

  test("Chýbajúce na zoznam povie, čo a kam pribudlo; Návod vyzerá ako tlačidlo", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");
    const s = page.locator("section#sklad");
    await s.getByRole("button", { name: "Pridať položku skladu" }).click();
    await s.getByLabel("Názov (napr. mlieko)").fill("Syntetické mlieko");
    await s.getByLabel("Množstvo").fill("0.2");
    await s.getByLabel("Jednotka").selectOption("l");
    await s.getByRole("button", { name: "Uložiť položku" }).click();
    await s.getByRole("button", { name: "Pridať recept" }).click();
    await s.getByLabel("Názov receptu").fill("Syntetické palacinky");
    await s.getByLabel("Surovina").selectOption({ label: "Syntetické mlieko (l)" });
    await s.getByLabel("Množstvo suroviny").fill("0.5");
    await s.getByRole("button", { name: "Uložiť recept" }).click();
    await s.getByRole("button", { name: "Chýbajúce na zoznam" }).click();
    await expect(s.getByText("Na zoznam Nakúpiť (vyššie, pod položkami skladu) pribudlo: Syntetické mlieko 0,3 l.")).toBeVisible();
    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad summary", { hasText: "Návod ▾" })).toBeVisible();
  });
});
