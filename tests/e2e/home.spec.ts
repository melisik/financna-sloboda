import { expect, test } from "@playwright/test";

test.describe("domovská obrazovka a úprava (M4, FR-09, FR-14)", () => {
  test("úprava, zmazanie s vrátením späť a prehľad", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Prehľad" })).toBeVisible();

    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.getByText("Posledné vyhodnotenie:").first()).toBeVisible();

    await page.getByLabel("Typ transakcie").selectOption("sporenie");
    await page.getByLabel("Suma (€)").fill("250");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 250 €")).toBeVisible();

    // Úprava: suma 250 → 300.
    await page.getByRole("button", { name: "Upraviť" }).click();
    await page.getByLabel("Suma (€)").fill("300");
    await page.getByRole("button", { name: "Uložiť zmeny" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 300 €")).toBeVisible();

    // Zmazanie a vrátenie späť.
    await page.getByRole("button", { name: "Zmazať" }).click();
    await expect(page.getByText("Transakcia bola zmazaná.")).toBeVisible();
    await expect(page.getByText("sporenie (do hotovosti) · 300 €")).toHaveCount(0);
    await page.getByRole("button", { name: "Vrátiť späť" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 300 €")).toBeVisible();
  });
});
