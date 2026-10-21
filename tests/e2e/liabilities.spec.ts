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
    await expect(page.getByText(/Dlh spolu:\s*12\D*000,00 €/)).toBeVisible();

    await page.reload();
    await goTo(page, "zavazky");
    await expect(page.locator("#zavazky div", { hasText: "úver syntetický" }).last()).toBeVisible();

    await page.locator("#zavazky div", { hasText: "úver syntetický" }).last().getByRole("button", { name: "Zmazať" }).click();
    await page.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(page.getByText("Zatiaľ nie je zapísaný žiadny záväzok.")).toBeVisible();
  });

  test("splatené záväzky sa nerátajú, zmazanie ukáže názov a splátka úveru je v rozpise výdavkov", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "zavazky");
    await page.getByRole("button", { name: "Pridať záväzok" }).click();
    await page.getByLabel("Názov", { exact: true }).fill("úver syntetický");
    await page.getByLabel("Zostatok dlhu (€)").fill("1200");
    await expect(page.getByLabel("Zostatok platí k (dátum)")).toBeVisible();
    await page.getByLabel("Splátka mesačne (€)").fill("250");
    await page.getByRole("button", { name: "Uložiť záväzok" }).click();

    await goTo(page, "prehlad");
    await page.getByText("Rozpis výdavkov", { exact: true }).click();
    await expect(page.getByText(/Splátky úverov a kariet: 250/)).toBeVisible();

    await goTo(page, "zavazky");
    const card = page.locator("#zavazky div", { hasText: "úver syntetický" }).last();
    await card.getByRole("button", { name: "Zmazať" }).click();
    await expect(page.getByText("Naozaj zmazať záväzok „úver syntetický“?")).toBeVisible();
    await page.getByRole("button", { name: "Zrušiť" }).click();

    await page.locator("#zavazky div", { hasText: "úver syntetický" }).last().getByRole("button", { name: "Upraviť" }).click();
    await page.getByLabel("Zostatok dlhu (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť záväzok" }).click();
    await expect(page.locator("#zavazky div", { hasText: "úver syntetický" }).last()).toContainText("Splatené. Nerátajú sa do mesačných výdavkov.");
    await expect(page.getByText(/Dlh spolu:\s*0,00 €/)).toBeVisible();
  });
});
