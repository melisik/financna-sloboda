import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp, TEST_NOW } from "./helpers";

// Sklad prepojený s výdavkami (D-301, docs/51 etapa 1). Syntetické názvy a sumy.
const PASTE = ["100000001 Syntetický jogurt", "4,000x\t5%\t0,59 €\t2,36 €", "100000002 Syntetický šampón", "1,000x\t23%\t3,50 €"].join("\n");

async function ready(page: import("@playwright/test").Page) {
  await page.clock.setFixedTime(TEST_NOW);
  await openApp(page);
  await goTo(page, "zaloha");
  await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
  await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
  await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
}

test.describe("sklad a výdavky", () => {
  test("položky dokladu sa dajú pridať do skladu s cenou; predvolene nie sú vybrané", async ({ page }) => {
    await ready(page);
    await goTo(page, "nova-transakcia");
    const t = page.locator("section#nova-transakcia");
    await t.getByRole("button", { name: "Nákup po položkách" }).click();
    await t.locator("summary", { hasText: "Doklad" }).click();
    await t.getByLabel("Položky z dokladu").fill(PASTE);
    await t.getByRole("button", { name: "Pridať z textu" }).click();
    await t.getByRole("button", { name: "Uložiť transakciu" }).click();
    await t.locator("li", { hasText: "5,86" }).getByRole("button", { name: "Upraviť" }).click();
    await t.getByRole("button", { name: "Pridať do skladu" }).click();
    const jogurt = t.getByRole("checkbox", { name: "Syntetický jogurt" });
    await expect(jogurt).not.toBeChecked();
    await expect(t.getByRole("checkbox", { name: "Syntetický šampón" })).not.toBeChecked();
    await jogurt.check();
    await t.getByRole("button", { name: "Pridať vybrané do skladu" }).click();
    await expect(t.getByText("Do skladu pribudla 1 položka.")).toBeVisible();
    await goTo(page, "sklad");
    const s = page.locator("section#sklad");
    await expect(s).toContainText("Syntetický jogurt");
    await expect(s).toContainText("4 ks · 0,59 € za ks");
  });

  test("Vyhodiť zníži množstvo a pripočíta hodnotu k vyhodeným tento mesiac", async ({ page }) => {
    await ready(page);
    await goTo(page, "sklad");
    const s = page.locator("section#sklad");
    await s.getByRole("button", { name: "Pridať položku skladu" }).click();
    await s.getByLabel("Názov (napr. mlieko)").fill("Syntetické mlieko");
    await s.getByLabel("Množstvo").fill("2");
    await s.getByLabel("Jednotka").selectOption("l");
    await s.getByLabel("Cena za jednotku (€, nepovinné)").fill("1.10");
    await s.getByRole("button", { name: "Uložiť položku" }).click();
    await s.getByRole("button", { name: "Vyhodiť" }).click();
    await s.getByLabel("Vyhodiť množstvo").fill("1");
    await s.getByRole("button", { name: "Potvrdiť vyhodenie" }).click();
    await expect(s).toContainText("1 l · 1,10 € za l");
    await expect(s).toContainText(/Vyhodené tento mesiac: 1,10\s€ \(1 položka\) · tento rok: 1,10\s€/);
  });

  test("pri prešlej spotrebe ponúkne Vyhodiť aj Ešte použiteľné", async ({ page }) => {
    await ready(page);
    await goTo(page, "sklad");
    const s = page.locator("section#sklad");
    await s.getByRole("button", { name: "Pridať položku skladu" }).click();
    await s.getByLabel("Názov (napr. mlieko)").fill("Syntetický syr");
    await s.getByLabel("Množstvo").fill("1");
    await s.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)").fill("2026-10-20");
    await s.getByRole("button", { name: "Uložiť položku" }).click();
    await s.getByRole("button", { name: "Ešte použiteľné" }).click();
    await expect(s.getByText("Uprav dátum spotreby a ulož.")).toBeVisible();
    await expect(s.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)")).toBeFocused();
  });
});
