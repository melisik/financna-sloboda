import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Ročný prehľad: rozpis zmeny K na sporenie, výdavky a zvyšok a súhrn po rokoch. Syntetické hodnoty.
test.describe("ročný prehľad: rozpis a súhrn", () => {
  test("zmena K sa rozpíše a ročný súhrn ukáže sporenie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Typ transakcie").selectOption("sporenie");
    await page.getByLabel("Suma (€)").fill("10");
    await page.getByLabel("Dátum", { exact: true }).fill("2026-02-10");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-03-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("10");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "rocny-prehlad");
    await expect(page.getByText(/z toho sporenie 10,00 €/)).toBeVisible();
    await expect(page.getByText(/Sporenie: 10,00 €/)).toBeVisible();
  });

  test("výdavky v kategóriách sa porovnajú s predchádzajúcim rokom (N-11)", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Suma (€)").fill("30");
    await page.getByLabel("Dátum", { exact: true }).fill("2025-02-10");
    await page.getByLabel("Kategória").selectOption("jedlo");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Suma (€)").fill("60");
    await page.getByLabel("Dátum", { exact: true }).fill("2026-02-10");
    await page.getByLabel("Kategória").selectOption("jedlo");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();

    await goTo(page, "rocny-prehlad");
    await expect(page.getByText(/jedlo: 60,00 € \(minulý rok 30,00 €, zmena \+30,00 €\)/)).toBeVisible();
  });
});
