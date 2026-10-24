import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// M3 (roadmapa): zadanie transakcie do 20 s a do 5 dotykov [predpoklad]; komponentové správanie formulárov.
// Testy bežia nad skutočným UI (projekt nemá jsdom ani testing-library).

async function setupGoalAndEvaluation(page: Page) {
  await openApp(page);
  // Nastavenia (cieľ a prah)
  await goTo(page, "nastavenia");
  await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
  await page.getByLabel("Miera výberu (%)").fill("4");
  await page.getByLabel("Reálny výnos r (%)").fill("3.5");
  await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
  await page.getByLabel("Prah výdavkov (€)").fill("100");
  await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
  // Vyhodnotenie k D_L (dátum v minulosti, aby transakcie po ňom boli započítané)
  await goTo(page, "vyhodnotenie");
  await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-10-01");
  await page.getByLabel("Hodnota investícií (€)").fill("100000");
  await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
  await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
  await expect(page.getByText("Posledné vyhodnotenie:").first()).toBeVisible();
  await goTo(page, "nova-transakcia");
}

test.describe("M3 – zadanie transakcií", () => {
  test("výdavok sa zadá do 5 dotykov a do 20 sekúnd", async ({ page }) => {
    await setupGoalAndEvaluation(page);
    const start = Date.now();
    let taps = 0;
    await page.getByLabel("Suma (€)").fill("150");
    taps += 1;
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    taps += 1;
    await expect(page.getByText("výdavok · 150,00 €").first()).toBeVisible();
    const elapsedMs = Date.now() - start;
    expect(taps).toBeLessThanOrEqual(5);
    expect(elapsedMs).toBeLessThan(20_000);
  });

  test("výdavok nad prahom sa označí „nad prahom“; výdavok pod prahom sa uloží bez značky (D-120)", async ({ page }) => {
    await setupGoalAndEvaluation(page);
    await page.getByLabel("Suma (€)").fill("50");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("výdavok · 50,00 € (z príjmu)").first()).toBeVisible();
    await expect(page.getByText("pod prahom")).toHaveCount(0);
    await page.getByLabel("Suma (€)").fill("150");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("výdavok · 150,00 € (z príjmu) · nad prahom").first()).toBeVisible();
  });

  test("prázdna alebo nulová suma sa neuloží a zobrazí chybu", async ({ page }) => {
    await setupGoalAndEvaluation(page);
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("Suma musí byť kladná.")).toBeVisible();
    await expect(page.getByText(/výdavok · 0,00 €/)).toHaveCount(0);
  });

  test("filter typu zobrazí len vybraný typ", async ({ page }) => {
    await setupGoalAndEvaluation(page);
    await page.getByLabel("Suma (€)").fill("150");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    // Počkaj, kým sa prvá transakcia uloží; inak jej dokončenie vymaže sumu druhej.
    await expect(page.getByText("výdavok · 150,00 €").first()).toBeVisible();
    await page.getByLabel("Typ transakcie").selectOption("sporenie");
    await page.getByLabel("Suma (€)").fill("250");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 250,00 €").first()).toBeVisible();
    await page.getByLabel("Filter typu").selectOption("sporenie");
    await expect(page.getByText("sporenie (do hotovosti) · 250,00 €").first()).toBeVisible();
    await expect(page.getByText("výdavok · 150,00 €")).toHaveCount(0);
  });
});
