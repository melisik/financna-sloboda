import { expect, test } from "@playwright/test";
import { goTo, navTo, openApp } from "./helpers";

// D-095: navigácia medzi sekciami; D-096 (N-04): vyhodnotenie sa predvyplní z aktuálneho kapitálu.
test.describe("navigácia a predvyplnenie vyhodnotenia (D-191)", () => {
  test("horný panel obsahuje skupiny a odkazy menia kotvu", async ({ page }) => {
    await openApp(page);
    const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
    await expect(nav.getByRole("button", { name: "Plán a výsledky", exact: true })).toBeVisible();
    await navTo(page, "vyhodnotenie");
    await expect(page).toHaveURL(/#vyhodnotenie$/);
    await expect(page.locator("section#vyhodnotenie")).toBeVisible();
    await expect(page.locator("section#prehlad")).toHaveCount(0);
    await navTo(page, "zaloha");
    await expect(page).toHaveURL(/#zaloha$/);
    await expect(page.locator("section#zaloha")).toBeVisible();
  });

  test("vyhodnotenie predvyplní K z posledného stavu plus sporenie od D_L", async ({ page }) => {
    await openApp(page);
    // Vyhodnotenie k D_L: investície 100 000 €, hotovosť 20 000 €
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-10-01");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    // Sporenie 250 € po D_L
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Dátum", { exact: true }).fill("2026-10-05");
    await page.getByLabel("Typ transakcie").selectOption("sporenie");
    await page.getByLabel("Suma (€)").fill("250");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 250,00 €")).toBeVisible();

    // Nové vyhodnotenie je predvyplnené: hotovosť 20 250 €, investície bez zmeny
    await goTo(page, "vyhodnotenie");
    await expect(page.getByLabel("Nasporená suma, hotovosť (€)")).toHaveValue("20250");
    await expect(page.getByLabel("Hodnota investícií (€)")).toHaveValue("100000");
  });
});
