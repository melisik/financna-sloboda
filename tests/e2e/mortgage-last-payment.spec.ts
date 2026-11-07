import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, openPropertyFolds } from "./helpers";

// Posledná splátka hypotéky (D-347, F-01): zostatok 800 €, splátka 600 €, 0 %, zostatok platí k 1. 9. 2026.
// Automatické splácanie pri načítaní: október 600 €, november 200 €, december 0 € na Prehľade, v Príjmoch aj v Rozpočte. Syntetické hodnoty.
const at = async (page: Page, iso: string) => {
  await page.clock.setFixedTime(new Date(`${iso}T10:00:00`));
  await openApp(page);
};
const eurRe = (cents: number) => `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, "0")}\\D?€`;

async function expectMortgage(page: Page, cents: number) {
  await goTo(page, "prehlad");
  await expect(page.getByText(new RegExp(`výdavky:\\D*${eurRe(cents)}`))).toBeVisible();
  await goTo(page, "prijmy");
  await expect(page.getByText(new RegExp(`minuté tento mesiac:\\D*${eurRe(cents)}`))).toBeVisible();
  await goTo(page, "rozpocet");
  if (cents > 0) await expect(page.getByText(new RegExp(`minuté\\D*${eurRe(cents)}\\D*z toho splátky hypoték\\D*${eurRe(cents)}`))).toBeVisible();
  else await expect(page.getByText(/z toho splátky hypoték/)).toHaveCount(0);
}

async function addMortgage(page: Page, balance = "800", balanceDate = "2026-09-01") {
  await goTo(page, "majetok");
  await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
  await openPropertyFolds(page);
  await page.getByLabel("Názov (nepovinné)").fill("Byt s hypotékou");
  await page.getByLabel("Režim").selectOption("vlastne_byvanie");
  await page.getByLabel("Odhad hodnoty (€)").fill("200000");
  await page.getByLabel("Dátum odhadu").fill(balanceDate);
  await page.getByLabel("Zostatok hypotéky (€)").fill(balance);
  await page.getByLabel("Zostatok platí k (dátum)").fill(balanceDate);
  await page.getByLabel("Mesačná splátka hypotéky (€)").fill("600");
  await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();
}

async function editProperty(page: Page, fill: (page: Page) => Promise<void>) {
  await goTo(page, "majetok");
  await page.locator("#majetok div", { hasText: "Byt" }).last().getByRole("button", { name: "Upraviť" }).first().click();
  await openPropertyFolds(page);
  await fill(page);
  await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();
}

test.describe("posledná splátka hypotéky", () => {
  test("október 600 €, november 200 € aj po opakovanom načítaní a úprave názvu, december 0 €", async ({ page }) => {
    await at(page, "2026-10-15");
    await addMortgage(page);
    await expectMortgage(page, 60_000);

    await at(page, "2026-11-15");
    await expectMortgage(page, 20_000);
    await at(page, "2026-11-16");
    await expectMortgage(page, 20_000);

    await editProperty(page, (p) => p.getByLabel("Názov (nepovinné)").fill("Byt premenovaný"));
    await expectMortgage(page, 20_000);

    await at(page, "2026-12-15");
    await expectMortgage(page, 0);
  });

  test("ručná zmena splátky zneplatní záznam: vykáže sa nová zmluvná splátka, nie zaznamenaných 600 €", async ({ page }) => {
    await at(page, "2026-10-15");
    await addMortgage(page);
    await expectMortgage(page, 60_000);

    await editProperty(page, (p) => p.getByLabel("Mesačná splátka hypotéky (€)").fill("550"));
    await expectMortgage(page, 55_000);
  });
});

// Mimoriadna splátka po pravidelnej (D-347): zostatok 10 000 € k 1. 10., splátka 600 €; 1. 11. sa zaplatí 600 € (zostatok 9 400 €).
// Mimoriadna 1 000 € 15. 11. zníži splátku na 525 €. November ostáva 600 €, december už 525 €.
test.describe("posledná splátka a mimoriadna splátka", () => {
  async function extraPayment(page: Page) {
    await goTo(page, "majetok");
    const card = page.locator("#majetok div", { hasText: "Byt s hypotékou" }).last();
    await card.locator("summary", { hasText: "Mimoriadna splátka hypotéky" }).click();
    await card.getByLabel("Dátum splátky").fill("2026-11-15");
    await card.getByLabel("Suma (€)").fill("1000");
    await expect(card.getByText(/Nová splátka: 525,00 €/)).toBeVisible();
    await card.getByRole("button", { name: "Zapísať mimoriadnu splátku" }).click();
    await expect(card).toContainText("Hypotéka: 8 400,00 €");
    return card;
  }

  test("november ostáva zaplatených 600 €, december nová splátka 525 €", async ({ page }) => {
    await at(page, "2026-11-15");
    await addMortgage(page, "10000", "2026-10-01");
    await expectMortgage(page, 60_000);
    await extraPayment(page);
    await expectMortgage(page, 60_000);

    await at(page, "2026-12-15");
    await expectMortgage(page, 52_500);
  });

  test("vrátenie mimoriadnej splátky v tom istom mesiaci: 600 € a zostatok 9 400 €", async ({ page }) => {
    await at(page, "2026-11-15");
    await addMortgage(page, "10000", "2026-10-01");
    const card = await extraPayment(page);
    await card.getByRole("button", { name: "Vrátiť poslednú mimoriadnu splátku" }).click();
    await card.getByRole("button", { name: "Potvrdiť vrátenie" }).click();
    await expect(card).toContainText("Hypotéka: 9 400,00 €");
    await expectMortgage(page, 60_000);
  });
});
