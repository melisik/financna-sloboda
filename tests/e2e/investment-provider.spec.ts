import { expect, test } from "@playwright/test";
import { goTo, openApp, openFormFolds } from "./helpers";

// Poskytovateľ investície zo zoznamu NBS (D-329, docs/63). Syntetické hodnoty.
test.describe("poskytovateľ investície (D-329)", () => {
  async function addPosition(page: import("@playwright/test").Page, provider?: string) {
    await page.getByRole("button", { name: "Pridať položku" }).click();
    await openFormFolds(page);
    await page.getByLabel("Názov alebo ticker").fill("ETF syntetický");
    await page.getByLabel("Počet kusov").fill("10");
    await page.getByLabel("Cena za kus (v mene položky)").fill("50");
    if (provider !== undefined) await page.getByLabel("Poskytovateľ").fill(provider);
  }

  test("pole je nepovinné, zoznam je z NBS a zdroj s dátumom je viditeľný", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page);
    await expect(page.locator("datalist#poskytovatelia-nbs option")).not.toHaveCount(0);
    await expect(page.getByText(/Zdroj zoznamu: Register subjektov finančného trhu, Národná banka Slovenska/)).toBeVisible();
    await expect(page.getByText(/nie odporúčanie ani záruka úplnosti/)).toBeVisible();
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.getByText("Spolu: 500,00 €")).toBeVisible();
  });

  test("firma zo zoznamu ponúkne odkaz do registra a ukáže sa na karte aj po reloade", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page);
    const first = await page.locator("datalist#poskytovatelia-nbs option").first().getAttribute("value");
    expect(first).toBeTruthy();
    await page.getByLabel("Poskytovateľ").fill(first!);
    const link = page.getByRole("link", { name: "Overiť v registri NBS" });
    await expect(link).toHaveAttribute("href", /^https:\/\/subjekty\.nbs\.sk\/sk\/search\?q=\d{6,8}$/);
    await expect(link).toHaveAttribute("target", "_blank");
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44); // dosť veľká plocha na ťuknutie na iPhone
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.locator("#investicie")).toContainText(first!.trim());
    await page.reload();
    await goTo(page, "investicie");
    await expect(page.locator("#investicie")).toContainText(first!.trim());
  });

  test("vlastný poskytovateľ sa uloží a register sa dá prehľadať podľa názvu", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page, "Trading 212");
    await expect(page.getByRole("link", { name: "Overiť v registri NBS" })).toHaveCount(0);
    const search = page.getByRole("link", { name: "Vyhľadať v registri NBS" });
    await expect(search).toHaveAttribute("href", "https://subjekty.nbs.sk/sk/search?q=Trading%20212");
    expect((await search.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(page.locator("#investicie")).toContainText("Trading 212");
  });
});
