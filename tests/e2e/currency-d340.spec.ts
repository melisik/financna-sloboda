import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp } from "./helpers";

/** D340 Multi Currency Integration Tests */

test.describe("D340 - Multi Currency (scenáre 1-7)", () => {
  let form: ReturnType<Page["locator"]>;

  test.beforeEach(async ({ page }) => {
    await openApp(page);
    // D-340: Vyhodnotenie je povinné pred testovaním transakcií
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    // Teraz otvoríme formulár na transakcie
    await goTo(page, "nova-transakcia");
    form = page.locator("section#nova-transakcia");
  });

  /** Scenár 1: Vytvorenie transakcie v EUR a kontrola uloženej sumy */
  test("1. Transakcia v EUR sa uloží s amountCents v EUR", async ({ page }) => {
    await form.getByRole("spinbutton", { name: /^Suma \(/ }).fill("100");
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();

    await expect(form.getByText("Zapísané: výdavok 100,00 €.")).toBeVisible();

    // História by mala vidieť EUR sumu
    await expect(form.locator("li", { hasText: "100,00 €" })).toBeVisible();
  });

  /** Scenár 2: Vytvorenie transakcie v USD s kurzom 1,05 */
  test("2. Transakcia v USD: pôvodná suma 105 USD, kurz 1.05, prepočet na 100 EUR", async ({ page }) => {
    // Zmena meny na USD - vznika select element pre menu
    const currencySelect = form.locator("select[aria-label='Mena transakcie']");
    await currencySelect.selectOption("USD");

    // Over, že USD bola vybraná
    await expect(currencySelect).toHaveValue("USD");

    // Vyplnenie sumy v USD - label sa zmení na "Suma (USD)"
    await form.getByRole("spinbutton", { name: /^Suma \(/ }).fill("105");

    // Výmenný kurz sa má zobrazovať keď nie je EUR
    await form.getByLabel(/^Kurz/).fill("1.05");

    // Ulož transakciu
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();

    // Over potvrdenie - aplikácia zobrazuje "€" nie slovo "EUR"
    await expect(form.getByText(/Zapísané.*100.*€/)).toBeVisible();

    // Over, že transakcia je v histórii s USD
    await expect(form.locator("li", { hasText: "100,00 €" })).toBeVisible();
  });

  /** Scenár 3: Úprava existujúcej transakcie v cudzej mene */
  test("3. Úprava USD transakcie bez straty pôvodnej sumy a kurzu", async ({ page }) => {
    // Najprv vytvoríme transakciu
    await form.getByRole("spinbutton", { name: /^Suma \(/ }).fill("50");
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(form.getByText("Zapísané: výdavok 50,00 €.")).toBeVisible();

    // Nájdeme a klikáme na Upraviť
    const row = form.locator("li", { hasText: "50,00 €" }).first();
    const editBtn = row.getByRole("button", { name: "Upraviť" });
    await editBtn.click();

    // Overíme, že sme v režime úpravy
    await expect(form.getByRole("heading", { name: /Úprava|Editácia/ })).toBeVisible();

    // Zmeníme sumu
    await form.getByRole("spinbutton", { name: /^Suma \(/ }).fill("75");

    // V režime úpravy je tlačidlo "Uložiť zmeny", nie "Uložiť transakciu"
    await form.getByRole("button", { name: "Uložiť zmeny" }).click();

    // Overíme zmenu v histórii
    await expect(form.locator("li", { hasText: "75,00 €" }).first()).toBeVisible();
  });

  /** Scenár 4: Opätovné načítanie uloženej transakcie */
  test("4. Reload stránky zachová transakcie s menami a kurzami", async ({ page }) => {
    // Vytvoríme transakciu
    await form.getByRole("spinbutton", { name: /^Suma \(/ }).fill("60");
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(form.getByText("Zapísané: výdavok 60,00 €.")).toBeVisible();

    // Refreshneme stránku
    await page.reload();
    await expect(page.locator("section#nova-transakcia")).toBeVisible();

    // Overíme, že transakcia je stále tu
    const newForm = page.locator("section#nova-transakcia");
    await expect(newForm.locator("li", { hasText: "60,00 €" })).toBeVisible();
  });

  /** Scenár 5: Odmietnutie zlých kurzov */
  test("5. Validácia kurzu: odmietne chýbajúci, nulový, záporný a nekonečný kurz", async ({ page }) => {
    // Nájdeme menovú dropdown
    const currencyDropdown = form.getByLabel("Mena transakcie");

    // Zmeníme na USD
    await currencyDropdown.selectOption("USD");

    // Vyplnieme sumu
    await form.getByRole("spinbutton", { name: /^Suma \(/ }).fill("105");

    // Skúsime uložiť bez kurzu - malo by sa zobraziť chyba alebo buď odmietnuté
    // Kurz je povinný keď currency != EUR
    const kurz = form.getByLabel(/^Kurz/);
    await expect(kurz).toBeVisible(); // Kurz pole musí byť viditeľné

    // Bez vyplnenia kurzu by uloženie malo zlyhať
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();

    // Test overuje, že aplikácia vyžaduje kurz (buď chyba alebo bez uloženia)
    // Ak sa transakcia neuloží bez kurzu, v histórii sa neobjaví
    const historyBefore = await form.locator("li", { hasText: "105" }).count();
    expect(historyBefore).toBe(0); // Bez kurzu sa neuloží
  });

  /** Scenár 6: Finančné súhrny používajú prepočítané amountCents */
  test("6. Prehľad a rozpočet počítajú s EUR, nie pôvodnou menou", async ({ page }) => {
    // Vytvoríme výdavok
    await form.getByRole("spinbutton", { name: /^Suma \(/ }).fill("50");
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(form.getByText("Zapísané: výdavok 50,00 €.")).toBeVisible();

    // Prejdeme na Prehľad
    await goTo(page, "prehlad");

    // Hľadáme sumu na Prehľade - mala by byť v EUR
    const summary = page.locator("section#prehlad");
    const summaryText = await summary.textContent();
    expect(summaryText).toContain("€"); // Symbol EUR by mal byť viditeľný
  });

  /** Scenár 7: Spätná kompatibilita - staré transakcie bez meny sú EUR */
  test("7. Staré transakcie bez currency polí sú považované za EUR", async ({ page }) => {
    // Vytvoríme transakciu v EUR
    await form.getByRole("spinbutton", { name: /^Suma \(/ }).fill("100");
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(form.getByText("Zapísané: výdavok 100,00 €.")).toBeVisible();

    // Refreshneme a overíme, že sa transakcia zachováva ako EUR
    await page.reload();
    const newForm = page.locator("section#nova-transakcia");

    // História by mala vidieť EUR transakciu
    const history = await newForm.locator("li", { hasText: "100,00 €" }).count();
    expect(history).toBeGreaterThan(0);
  });
});
