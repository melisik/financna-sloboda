import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-340: zobrazenie prepočítanej sumy v EUR pri transakcii v cudzej mene, nezávislé od Predbežného dopadu. Syntetické hodnoty.
test.describe("Transakcie: prepočítaná suma pri cudzej mene (D-340)", () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    // Uloženie a Predbežný dopad potrebujú stav z Vyhodnotenia (ctx.latest).
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "nova-transakcia");
    await page.getByRole("button", { name: "+ Pridať transakciu" }).click();
  });

  test("pri EUR sa riadok Prepočítaná suma nezobrazuje", async ({ page }) => {
    const form = page.locator("section#nova-transakcia");
    await form.getByLabel("Suma (EUR)").fill("100");
    await expect(form.getByText("Prepočítaná suma", { exact: false })).toHaveCount(0);
  });

  test("pri cudzej mene sa prepočítaná suma aktualizuje so sumou aj kurzom (108 USD @ 1,08 = 100,00 €)", async ({ page }) => {
    const form = page.locator("section#nova-transakcia");
    await form.getByLabel("Mena").selectOption("USD");
    await form.getByLabel("Suma (USD)").fill("108");
    await form.getByLabel("Kurz: počet jednotiek USD za 1 EUR").fill("1.08");
    await expect(form.getByText("Prepočítaná suma: 100,00 €")).toBeVisible();

    // Zmena sumy prepočet aktualizuje.
    await form.getByLabel("Suma (USD)").fill("216");
    await expect(form.getByText("Prepočítaná suma: 200,00 €")).toBeVisible();

    // Zmena kurzu prepočet aktualizuje.
    await form.getByLabel("Kurz: počet jednotiek USD za 1 EUR").fill("2");
    await expect(form.getByText("Prepočítaná suma: 108,00 €")).toBeVisible();

    // Zmena meny na EUR riadok skryje.
    await form.getByLabel("Mena").selectOption("EUR");
    await expect(form.getByText("Prepočítaná suma", { exact: false })).toHaveCount(0);
  });

  test("pri chýbajúcom alebo neplatnom kurze sa nezobrazí zavádzajúca suma", async ({ page }) => {
    const form = page.locator("section#nova-transakcia");
    await form.getByLabel("Mena").selectOption("USD");
    await form.getByLabel("Suma (USD)").fill("108");
    await form.getByLabel("Kurz: počet jednotiek USD za 1 EUR").fill("");
    await expect(form.getByText("Prepočítaná suma: –", { exact: false })).toBeVisible();

    await form.getByLabel("Kurz: počet jednotiek USD za 1 EUR").fill("0");
    await expect(form.getByText("Prepočítaná suma: –", { exact: false })).toBeVisible();

    await form.getByLabel("Kurz: počet jednotiek USD za 1 EUR").fill("-5");
    await expect(form.getByText("Prepočítaná suma: –", { exact: false })).toBeVisible();
  });

  test("prepočítaná suma je viditeľná aj pri zdroji „z príjmu“, kde je Predbežný dopad „bez zmeny“", async ({ page }) => {
    // Predbežný dopad potrebuje cieľ, teda ročné výdavky v Nastaveniach.
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await goTo(page, "nova-transakcia");
    const form = page.locator("section#nova-transakcia");
    await form.getByRole("button", { name: "+ Pridať transakciu" }).click();

    await expect(form.getByLabel("Zdroj úhrady")).toHaveValue("z_prijmu");
    await form.getByLabel("Mena").selectOption("USD");
    await form.getByLabel("Suma (USD)").fill("108");
    await form.getByLabel("Kurz: počet jednotiek USD za 1 EUR").fill("1.08");

    await expect(form.getByText("Predbežný dopad: bez zmeny")).toBeVisible();
    await expect(form.getByText("Prepočítaná suma: 100,00 €")).toBeVisible();
  });

  test("pri úprave uloženej cudzomenovej transakcie sa prepočítaná suma zobrazí podľa načítaných údajov", async ({ page }) => {
    const form = page.locator("section#nova-transakcia");
    await form.getByLabel("Mena").selectOption("USD");
    await form.getByLabel("Suma (USD)").fill("108");
    await form.getByLabel("Kurz: počet jednotiek USD za 1 EUR").fill("1.08");
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();

    const row = form.locator("li", { hasText: "výdavok · 100,00 €" });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Upraviť" }).click();

    await expect(form.getByLabel("Suma (USD)")).toHaveValue("108");
    await expect(form.getByLabel("Kurz: počet jednotiek USD za 1 EUR")).toHaveValue("1.08");
    await expect(form.getByText("Prepočítaná suma: 100,00 €")).toBeVisible();

    // Upratanie: vymazať testovaciu transakciu, aby test nezanechal dáta.
    await form.getByRole("button", { name: "Zmazať transakciu" }).click();
    await form.getByRole("button", { name: "Zmazať", exact: true }).click();
  });

  test("položkový režim (vždy EUR) riadok Prepočítaná suma nezobrazuje ani pri predošlej cudzej mene", async ({ page }) => {
    const form = page.locator("section#nova-transakcia");
    await form.getByLabel("Mena").selectOption("USD");
    await form.getByLabel("Suma (USD)").fill("108");
    await form.getByLabel("Kurz: počet jednotiek USD za 1 EUR").fill("1.08");
    await form.getByRole("button", { name: "Nákup po položkách" }).click();
    await expect(form.getByText("Prepočítaná suma", { exact: false })).toHaveCount(0);
  });
});
