import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-103: záväzky okrem hypotéky majú vlastnú sekciu. Syntetické hodnoty.
test.describe("sekcia Záväzky (D-103)", () => {
  test("pridanie, súčty, pretrvanie po reloade a zmazanie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zavazky");
    await expect(page.getByText("Zatiaľ nie je zapísaný žiadny záväzok.")).toBeVisible();

    await page.getByRole("button", { name: "Pridať záväzok" }).click();
    await page.getByLabel("Názov", { exact: true }).fill("úver syntetický");
    await page.getByLabel("Zostatok dlhu (€)").fill("12000");
    await page.getByLabel("Úroková sadzba (% p. a.)").fill("9");
    await page.getByLabel("Splátka mesačne (€)").fill("250");
    await page.getByRole("button", { name: "Uložiť záväzok" }).click();

    const card = page.locator("#zavazky div", { hasText: "úver syntetický" }).last();
    await expect(card.locator("dl")).toContainText(/Úrok za mesiac\D*90/);
    await expect(page.getByText(/Dlh spolu:\s*12\D*000 €/)).toBeVisible();

    await page.reload();
    await goTo(page, "zavazky");
    await expect(page.locator("#zavazky div", { hasText: "úver syntetický" }).last()).toBeVisible();

    await page.locator("#zavazky div", { hasText: "úver syntetický" }).last().getByRole("button", { name: "Zmazať" }).click();
    await page.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(page.getByText("Zatiaľ nie je zapísaný žiadny záväzok.")).toBeVisible();
  });
});
