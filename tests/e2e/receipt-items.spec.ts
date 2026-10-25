import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Položky dokladu z portálu (D-129). Syntetické názvy a kódy.
const PASTE = [
  "100000001 Testovací výrobok A",
  "1,000x\t23%\t3,50 €",
  "100000003 Výrobok C",
  "2,000x\t5%\t5,75 €\t11,50 €",
].join("\n");

test.describe("položky dokladu z portálu", () => {
  test("vložený text sa rozdelí na položky, uloží sa k výdavku a pri úprave sa zobrazí", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByRole("button", { name: "Nákup po položkách" }).click();
    // Doklad je zbalený, kým ho používateľ neotvorí (D-286).
    await page.locator("section#nova-transakcia summary", { hasText: "Doklad" }).click();
    await page.getByLabel("Položky z dokladu").fill(PASTE);
    await expect(page.getByText("Nerozpoznané")).toHaveCount(0);
    await page.getByRole("button", { name: "Pridať z textu" }).click();
    // Suma sa nezadáva; je súčtom položiek (D-313).
    await expect(page.getByText("Spolu: 15,00 €")).toBeVisible();
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();

    await expect(page.locator("section#nova-transakcia li", { hasText: "položiek: 2" })).toBeVisible();
    await page.getByRole("button", { name: "Upraviť" }).first().click();
    await expect(page.getByRole("button", { name: "Odstrániť položku Výrobok C" })).toBeVisible();
    await expect(page.getByText("Spolu: 15,00 €")).toBeVisible();
  });
});
