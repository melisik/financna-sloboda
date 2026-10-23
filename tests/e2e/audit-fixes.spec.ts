import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Opravy po audite 2026-10-22 (docs/22). Syntetické hodnoty.
const CHROME_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1";
const SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

test.describe("záporné sporenie v nastaveniach (nález 1)", () => {
  test("záporné mesačné sporenie sa neuloží a dostane jasnú hlášku", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Mesačné sporenie do investícií (€), prázdne = odvodené").fill("-100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await expect(page.getByText("Mesačné sporenie nesmie byť záporné.")).toBeVisible();
  });
});

test.describe("prečerpanie investícií v Prehľade (nález 3, D-059, D-167)", () => {
  test("výdavok nad K_inv ukáže sumu prečerpania", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Zdroj úhrady").selectOption("z_investicii");
    await page.getByLabel("Suma (€)").fill("150");
    await page.getByLabel("Rozumiem, investície sa vyčerpajú a K_inv bude 0 €.").check();
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();

    await expect(page.locator("section#nova-transakcia")).toContainText("prečerpanie 50,00 € nad K_inv");
    await goTo(page, "prehlad");
    await expect(page.locator("section#prehlad")).toContainText("Prečerpanie investícií: 50,00 €");
  });
});

test.describe("iPhone, Chrome (nález 4, D-168)", () => {
  test.use({ userAgent: CHROME_IPHONE });
  test("appku neblokuje a povie, ako ju pridať na plochu", async ({ page }) => {
    await openApp(page);
    await expect(page.getByText("Na plochu appku pridáš v Safari")).toBeVisible();
  });
});

test.describe("iPhone, Safari (D-053)", () => {
  test.use({ userAgent: SAFARI_IPHONE });
  test("zostáva s výzvou na plochu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Najprv pridaj appku na plochu" })).toBeVisible();
  });
});

test.describe("splátka pod úrokom (nález 8, D-169)", () => {
  test("pri zápise záväzku splátka pod úrokom dostane upozornenie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zavazky");
    await page.getByRole("button", { name: "Pridať záväzok" }).click();
    await page.getByLabel("Názov", { exact: true }).fill("úver syntetický");
    await page.getByLabel("Zostatok dlhu (€)").fill("1000");
    await page.getByLabel("Úroková sadzba (% p. a.)").fill("12");
    await page.getByLabel("Splátka mesačne (€)").fill("5");
    await expect(page.getByText("Splátka nepokryje mesačný úrok")).toBeVisible();
  });
});
