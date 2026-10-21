import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Fáza 2 (vetva): karta majetku, syntetické hodnoty (docs/11_Karta_majetku.md).
test.describe("karta majetku (Fáza 2)", () => {
  test("pridanie, pretrvanie po reloade, zmena režimu a zmazanie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await expect(page.getByText("Zatiaľ nie je zapísaná žiadna nehnuteľnosť.")).toBeVisible();

    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByLabel("Názov (nepovinné)").fill("byt – syntetický");
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("300000");
    await page.getByLabel("Dátum odhadu (RRRR-MM-DD)").fill("2026-10-01");
    await page.getByLabel("Zostatok hypotéky (€)").fill("150000");
    await page.getByLabel("Mesačný nájom (€, nepovinné)").fill("900");
    await page.getByLabel("Úroková sadzba hypotéky (% p. a.)").fill("3.6");
    await page.getByLabel("Mesačná splátka hypotéky (€)").fill("800");
    await page.getByLabel("Ostatné mesačné náklady (€)").fill("150");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    const card = page.locator("#majetok div", { hasText: "byt – syntetický" }).last();
    await expect(card).toContainText(/Čistá hodnota:\s*150\D?000 €/);
    await expect(card).toContainText("Do K sa počíta ako čistá hodnota.");
    await expect(card.locator("dl")).toContainText(/Nájom\D*900/);
    await expect(card.locator("dl")).toContainText(/Splátka hypotéky\D*800/);
    await expect(card.locator("dl")).toContainText(/Mesačné náklady spolu\D*950/);
    await expect(card.locator("dl")).toContainText(/z toho úrok\D*450/);
    await expect(card.locator("dl")).toContainText(/z toho istina\D*350/);

    // Pretrvanie po obnovení stránky (IndexedDB, schéma v2).
    await page.reload();
    await expect(page.locator("section#majetok")).toBeVisible();
    await expect(page.locator("#majetok div", { hasText: "byt – syntetický" }).last()).toContainText("Do K sa počíta ako čistá hodnota.");

    // Zmena režimu na vlastné bývanie: mimo K a v súhrne nad zoznamom.
    await page.getByRole("button", { name: "Upraviť" }).click();
    await page.getByLabel("Režim").selectOption("vlastne_byvanie");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();
    await expect(page.locator("#majetok div", { hasText: "byt – syntetický" }).last()).toContainText("Do K sa nepočíta.");
    await expect(page.locator("#majetok")).toContainText(/Mimo K: vlastné bývanie/);

    // Zmazanie s potvrdením.
    await page.getByRole("button", { name: "Zmazať" }).click();
    await page.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(page.getByText("Zatiaľ nie je zapísaná žiadna nehnuteľnosť.")).toBeVisible();
  });

  test("chýbajúci odhad hodnoty sa pomenuje a nič sa neuloží", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();
    await expect(page.getByText("Vyplň odhad hodnoty.")).toBeVisible();
    await expect(page.getByText("Zatiaľ nie je zapísaná žiadna nehnuteľnosť.")).toHaveCount(0);
  });

  test("automobil a ocenitelné právo: pridanie, pretrvanie po reloade a zmazanie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať: automobil" }).click();
    await page.getByLabel("Názov (napr. značka a rok, alebo podiel)").fill("auto – syntetické 2019");
    await page.getByLabel("Odhad hodnoty (€)").fill("12000");
    await page.getByLabel("Dátum odhadu (RRRR-MM-DD)").fill("2026-10-01");
    await page.getByRole("button", { name: "Uložiť", exact: true }).click();
    const car = page.locator("#majetok div", { hasText: "auto – syntetické 2019" }).last();
    await expect(car).toContainText("Odhad: 12 000 €");
    await expect(car).toContainText("Do K sa zatiaľ nepočíta.");

    await page.getByRole("button", { name: "Pridať: ocenitelné právo" }).click();
    await page.getByLabel("Názov (napr. značka a rok, alebo podiel)").fill("podiel – syntetický");
    await page.getByLabel("Odhad hodnoty (€)").fill("5000");
    await page.getByLabel("Dátum odhadu (RRRR-MM-DD)").fill("2026-10-01");
    await page.getByRole("button", { name: "Uložiť", exact: true }).click();
    await expect(page.locator("#majetok div", { hasText: "podiel – syntetický" }).last()).toContainText("Ocenitelné právo");

    await page.reload();
    await expect(page.locator("section#majetok")).toBeVisible();
    await expect(page.locator("#majetok div", { hasText: "auto – syntetické 2019" }).last()).toBeVisible();

    await page.locator("#majetok div", { hasText: "auto – syntetické 2019" }).last().getByRole("button", { name: "Zmazať" }).click();
    await page.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(page.getByText("auto – syntetické 2019")).toHaveCount(0);
  });
});
