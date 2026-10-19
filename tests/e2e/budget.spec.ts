import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-106: limit kategórie a výdavok zaradený do kategórie. Syntetické hodnoty.
test.describe("rozpočet kategórií (D-106)", () => {
  test("limit sa ukáže a výdavok v kategórii sa od neho odpočíta", async ({ page }) => {
    await openApp(page);
    // Vyhodnotenie je potrebné, aby sa dali zapisovať transakcie.
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.getByText("Posledné vyhodnotenie:").first()).toBeVisible();

    await goTo(page, "rozpocet");
    await page.getByLabel("jedlo: limit (€)").fill("300");
    await page.getByRole("button", { name: "Uložiť rozpočet" }).click();
    await expect(page.getByLabel("jedlo: limit (€)")).toHaveValue("300");

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Suma (€)").fill("120");
    await page.getByLabel("Kategória").selectOption("jedlo");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("výdavok · 120 €").first()).toBeVisible();

    await goTo(page, "rozpocet");
    await expect(page.getByText(/minuté tento mesiac 120 €; zostáva 180 €/)).toBeVisible();
  });
});
