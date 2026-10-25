import { expect, test } from "@playwright/test";
import { goTo, openApp, openDetails } from "./helpers";

// História transakcií: filter kategórie, súčty podľa kategórie a potvrdenie zmazania. Syntetické hodnoty.
test.describe("história transakcií", () => {
  test("filter kategórie, súčty podľa kategórie a zmazanie až po potvrdení", async ({ page }) => {
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
    await page.getByLabel("Suma (€)").fill("45");
    await page.getByLabel("Kategória").selectOption("jedlo");
    const rows = page.locator("section#nova-transakcia li", { hasText: "Výdavok" });
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(rows).toHaveCount(1);

    await page.getByLabel("Suma (€)").fill("3");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(rows).toHaveCount(2);
    await expect(page.getByText("Výdavky podľa kategórie: jedlo 45,00 € · nezaradené 3,00 €")).toBeVisible();

    await openDetails(page, "section#nova-transakcia", "Filter"); // D-293: filter je zbalený
    await page.getByLabel("Filter kategórie").selectOption("jedlo");
    await expect(rows).toHaveCount(1);
    await expect(rows.first()).toContainText("45");
    await page.getByLabel("Filter kategórie").selectOption("all");

    // Zmazanie je v úprave záznamu a len s potvrdením (D-199, D-286).
    const form = page.locator("section#nova-transakcia");
    await rows.first().getByRole("button", { name: "Upraviť" }).click();
    await form.getByRole("button", { name: "Zmazať transakciu" }).click();
    await expect(form).toContainText("Naozaj zmazať?");
    await expect(rows).toHaveCount(2);
    await form.getByRole("button", { name: "Zrušiť", exact: true }).click();
    await expect(rows).toHaveCount(2);
    await form.getByRole("button", { name: "Zmazať transakciu" }).click();
    await form.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(rows).toHaveCount(1);
  });
});
