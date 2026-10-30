import { expect, test, type Page } from "@playwright/test";
import { goTo, localIsoDay, openApp } from "./helpers";

/** Finančný kalendár (D-345): povinnosti, zaplatenie cez transakciu, zrušenie zaplatenia, ochrana pred duplicitou. Syntetické údaje. */

const NAME = "TEST D342 – Servis automobilu";
const cal = (page: Page) => page.locator("section#financny-kalendar");
const txs = (page: Page) => page.locator("section#nova-transakcia");

async function seedEvaluation(page: Page) {
  await goTo(page, "vyhodnotenie");
  await page.getByLabel("Hodnota investícií (€)").fill("100000");
  await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
  await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
}

/** Povinnosť so splatnosťou dnes, aby bola v aktuálnom mesiaci a zhodná s dátumom transakcie. */
async function addObligation(page: Page, name = NAME, amount = "125") {
  await goTo(page, "financny-kalendar");
  const s = cal(page);
  await s.getByRole("button", { name: "+ Pridať jednorazovú povinnosť" }).click();
  await s.getByLabel("Názov (napr. Poistenie auta)").fill(name);
  await s.getByLabel("Suma (€)").fill(amount);
  await s.getByLabel("Dátum splatnosti").fill(localIsoDay(0));
  await s.locator("select").selectOption("iné");
  await s.getByRole("button", { name: "Uložiť", exact: true }).click();
  await expect(s.locator("li", { hasText: name })).toBeVisible();
}

const confirmPanel = (page: Page) => cal(page).getByRole("group", { name: "Potvrdenie vytvorenia transakcie" });

async function paid(page: Page) {
  const row = cal(page).locator("li", { hasText: NAME });
  await row.getByRole("button", { name: "Zaplatené" }).click();
  await confirmPanel(page).getByRole("button", { name: "Vytvoriť transakciu a označiť ako zaplatené" }).click();
  await expect(row.getByText("prepojená s transakciou")).toBeVisible();
}

test.describe("Finančný kalendár (D-345)", () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test("sekcia je dostupná cez navigáciu a zobrazuje mesačný prehľad", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = cal(page);
    await expect(section.getByRole("button", { name: "◀" })).toBeVisible();
    await expect(section.getByRole("button", { name: "▶" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Tento mesiac" })).toBeVisible();
  });

  test("navigácia medzi mesiacmi funguje", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = cal(page);
    const label = section.locator("strong").filter({ hasText: /\d{4}/ }).first();
    const before = await label.textContent();
    await section.getByRole("button", { name: "◀" }).click();
    expect(await label.textContent()).not.toBe(before);
    await section.getByRole("button", { name: "Tento mesiac" }).click();
    expect(await label.textContent()).toBe(before);
  });

  test("pridanie a zmazanie jednorazovej povinnosti", async ({ page }) => {
    await addObligation(page, "Na zmazanie", "10");
    const row = cal(page).locator("li", { hasText: "Na zmazanie" });
    await expect(row.getByRole("button", { name: "Zaplatené" })).toBeVisible();
    await row.getByRole("button", { name: "Zmazať" }).click();
    await expect(cal(page).locator("li", { hasText: "Na zmazanie" })).toHaveCount(0);
  });

  test("formulár nevypočíta chybné vstupy", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = cal(page);
    await section.getByRole("button", { name: "+ Pridať jednorazovú povinnosť" }).click();
    await section.getByRole("button", { name: "Uložiť", exact: true }).click();
    await expect(section.getByRole("alert")).toBeVisible();
    await section.getByRole("button", { name: "Zrušiť", exact: true }).click();
    await expect(section.getByRole("heading", { name: "Nová povinnosť" })).toHaveCount(0);
  });

  test("Zaplatené ponúkne transakciu s predvyplnenými údajmi a po potvrdení ju vytvorí a prepojí", async ({ page }) => {
    await seedEvaluation(page);
    await addObligation(page);
    const row = cal(page).locator("li", { hasText: NAME });
    await row.getByRole("button", { name: "Zaplatené" }).click();

    const panel = confirmPanel(page);
    await expect(panel).toBeVisible();
    await expect(panel.getByLabel("Suma (€)")).toHaveValue("125");
    await expect(panel.getByLabel("Dátum platby")).toHaveValue(localIsoDay(0));
    await expect(panel.getByLabel("Poznámka")).toHaveValue(NAME);
    await expect(panel.getByText("Kategória: iné")).toBeVisible();
    // Kým používateľ nepotvrdí, povinnosť ostáva nezaplatená a transakcia nevznikla.
    await expect(row.getByText("zaplatené", { exact: true })).toHaveCount(0);

    await panel.getByRole("button", { name: "Vytvoriť transakciu a označiť ako zaplatené" }).click();
    await expect(row.getByText("zaplatené", { exact: true })).toBeVisible();
    await expect(row.getByText("prepojená s transakciou")).toBeVisible();
    await expect(cal(page).getByRole("status")).toContainText("Transakcia bola vytvorená");

    await goTo(page, "nova-transakcia");
    const hist = txs(page).locator("li", { hasText: "výdavok · 125,00 €" });
    await expect(hist).toHaveCount(1);
    await expect(hist).toContainText(NAME);
  });

  test("odmietnutie potvrdenia nevytvorí transakciu a povinnosť ostane nezaplatená", async ({ page }) => {
    await seedEvaluation(page);
    await addObligation(page);
    const row = cal(page).locator("li", { hasText: NAME });
    await row.getByRole("button", { name: "Zaplatené" }).click();
    await confirmPanel(page).getByRole("button", { name: "Zrušiť", exact: true }).click();
    await expect(confirmPanel(page)).toHaveCount(0);
    await expect(row.getByRole("button", { name: "Zaplatené" })).toBeVisible();
    await goTo(page, "nova-transakcia");
    await expect(txs(page).locator("li", { hasText: "výdavok · 125,00 €" })).toHaveCount(0);
  });

  test("dvojklik na potvrdenie a obnovenie stránky nevytvoria druhú transakciu", async ({ page }) => {
    await seedEvaluation(page);
    await addObligation(page);
    const row = cal(page).locator("li", { hasText: NAME });
    await row.getByRole("button", { name: "Zaplatené" }).click();
    await confirmPanel(page).getByRole("button", { name: "Vytvoriť transakciu a označiť ako zaplatené" }).dblclick();
    await expect(row.getByText("prepojená s transakciou")).toBeVisible();
    await expect(row.getByRole("button", { name: "Zaplatené", exact: true })).toHaveCount(0);

    await page.reload();
    await goTo(page, "financny-kalendar");
    await expect(row.getByText("prepojená s transakciou")).toBeVisible();
    await expect(row.getByRole("button", { name: "Zaplatené", exact: true })).toHaveCount(0);
    await goTo(page, "nova-transakcia");
    await expect(txs(page).locator("li", { hasText: "výdavok · 125,00 €" })).toHaveCount(1);
  });

  test("zrušenie zaplatenia: ponechať nič nemení, potvrdenie zmaže len prepojenú transakciu", async ({ page }) => {
    await seedEvaluation(page);
    await addObligation(page);
    await paid(page);
    const row = cal(page).locator("li", { hasText: NAME });

    // Ručná transakcia s rovnakou sumou a dňom nepatrí povinnosti a musí ostať.
    await goTo(page, "nova-transakcia");
    await txs(page).getByRole("button", { name: "+ Pridať transakciu" }).click();
    await txs(page).getByLabel(/^Suma \((€|EUR)\)/).fill("125");
    await txs(page).getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(txs(page).locator("li", { hasText: "výdavok · 125,00 €" })).toHaveCount(2);

    await goTo(page, "financny-kalendar");
    await row.getByRole("button", { name: "Zrušiť zaplatenie" }).click();
    const dialog = cal(page).getByRole("alertdialog");
    await expect(dialog).toContainText("odstráni z histórie");
    await dialog.getByRole("button", { name: "Ponechať zaplatené" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(row.getByText("prepojená s transakciou")).toBeVisible();
    await goTo(page, "nova-transakcia");
    await expect(txs(page).locator("li", { hasText: "výdavok · 125,00 €" })).toHaveCount(2);

    await goTo(page, "financny-kalendar");
    await row.getByRole("button", { name: "Zrušiť zaplatenie" }).click();
    await cal(page).getByRole("alertdialog").getByRole("button", { name: "Áno, zrušiť zaplatenie" }).click();
    await expect(row.getByRole("button", { name: "Zaplatené", exact: true })).toBeVisible();
    await expect(row.getByText("prepojená s transakciou")).toHaveCount(0);
    await expect(row.getByText("čaká na úhradu")).toBeVisible();
    await goTo(page, "nova-transakcia");
    await expect(txs(page).locator("li", { hasText: "výdavok · 125,00 €" })).toHaveCount(1);
  });

  test("úprava prepojenej transakcie zachová prepojenie", async ({ page }) => {
    await seedEvaluation(page);
    await addObligation(page);
    await paid(page);
    await goTo(page, "nova-transakcia");
    const li = txs(page).locator("li", { hasText: "výdavok · 125,00 €" });
    await li.getByRole("button", { name: "Upraviť" }).click();
    await txs(page).getByRole("button", { name: "Uložiť zmeny" }).click();
    await goTo(page, "financny-kalendar");
    const row = cal(page).locator("li", { hasText: NAME });
    await expect(row.getByText("prepojená s transakciou")).toBeVisible();
    await row.getByRole("button", { name: "Zrušiť zaplatenie" }).click();
    await cal(page).getByRole("alertdialog").getByRole("button", { name: "Áno, zrušiť zaplatenie" }).click();
    await goTo(page, "nova-transakcia");
    await expect(txs(page).locator("li", { hasText: "výdavok · 125,00 €" })).toHaveCount(0);
  });

  test("ručná transakcia s rovnakou sumou a dňom ako povinnosť: upozornenie, ale uloženie je možné a nič sa neprepojí", async ({ page }) => {
    await seedEvaluation(page);
    await addObligation(page);
    await goTo(page, "nova-transakcia");
    await txs(page).getByRole("button", { name: "+ Pridať transakciu" }).click();
    await expect(txs(page).getByText("V kalendári čaká povinnosť")).toHaveCount(0);
    await txs(page).getByLabel(/^Suma \((€|EUR)\)/).fill("125");
    await expect(txs(page).getByText(`V kalendári čaká povinnosť „${NAME}“`)).toBeVisible();
    await txs(page).getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(txs(page).locator("li", { hasText: "výdavok · 125,00 €" })).toHaveCount(1);

    await goTo(page, "financny-kalendar");
    const row = cal(page).locator("li", { hasText: NAME });
    await expect(row.getByRole("button", { name: "Zaplatené", exact: true })).toBeVisible();
    await expect(row.getByText("prepojená s transakciou")).toHaveCount(0);
  });
});
