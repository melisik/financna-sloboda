import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Drobné úpravy textov z externej revízie: slovenský výber súboru a zrozumiteľný filter histórie.
test.describe("texty z revízie", () => {
  test("v Zálohe je slovenský výber súboru a stav bez súboru", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    await expect(page.getByRole("button", { name: "Vybrať súbor zálohy" })).toBeVisible();
    await expect(page.getByText("Nie je vybraný žiadny súbor")).toBeVisible();
    await expect(page.getByText("Choose File")).toHaveCount(0);
  });

  test("filter histórie má slovné popisky a prázdny súčet vysvetlí, čo sa zobrazuje", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await expect(page.getByLabel("Od dátumu")).toBeVisible();
    await expect(page.getByText("Súčet zobrazených transakcií: žiadne transakcie")).toBeVisible();
  });
});
