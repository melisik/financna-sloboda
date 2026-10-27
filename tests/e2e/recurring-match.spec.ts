import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, TEST_NOW } from "./helpers";

// B-01: upozornenie na pravidelný výdavok (D-299, docs/53). Syntetické dáta z testovacia-zaloha.json.
async function withBackup(page: Page) {
  await page.clock.setFixedTime(TEST_NOW);
  await openApp(page);
  await goTo(page, "zaloha");
  await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
  await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
  await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
}

test.describe("upozornenie na dvojitý zápis pravidelného výdavku (B-01, D-299)", () => {
  test("výdavok 650 € v kategórii bývanie vyvolá upozornenie na Nájom", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");

    await s.getByLabel("Suma (€)").fill("650");
    await s.getByLabel("Kategória").selectOption("bývanie");
    await s.getByRole("button", { name: "Uložiť transakciu" }).click();

    await expect(page.getByText(/Toto vyzer. ako pravideln. v.davok/)).toBeVisible();
  });

  test("suma mimo tolerancie (651,01 €) upozornenie nevyvolá", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");

    await s.getByLabel("Suma (€)").fill("651.01");
    await s.getByLabel("Kategória").selectOption("bývanie");
    await s.getByRole("button", { name: "Uložiť transakciu" }).click();

    await expect(s.getByText(/Toto vyzerá ako pravidelný výdavok/)).toHaveCount(0);
  });

  test("iná kategória (jedlo) upozornenie nevyvolá", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");

    await s.getByLabel("Suma (€)").fill("650");
    await s.getByLabel("Kategória").selectOption("jedlo");
    await s.getByRole("button", { name: "Uložiť transakciu" }).click();

    await expect(s.getByText(/Toto vyzerá ako pravidelný výdavok/)).toHaveCount(0);
  });

  test("Uložiť aj tak uloží transakciu napriek zhode", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");

    await s.getByLabel("Suma (€)").fill("650");
    await s.getByLabel("Kategória").selectOption("bývanie");
    await s.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText(/Toto vyzer. ako pravideln. v.davok/)).toBeVisible();
    await page.getByRole("button", { name: "Uložiť aj tak" }).click();

    await expect(page.getByText(/Toto vyzer. ako pravideln. v.davok/)).toHaveCount(0);
    await expect(s.locator("li", { hasText: "650,00" }).first()).toBeVisible();
  });
});
