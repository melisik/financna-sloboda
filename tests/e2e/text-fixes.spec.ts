import { expect, test } from "@playwright/test";
import { goTo, openApp, openDetails } from "./helpers";

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
    await openDetails(page, "section#nova-transakcia", "Filter"); // D-293
    await expect(page.getByLabel("Od dátumu")).toBeVisible();
    await expect(page.getByText("Súčet všetkých transakcií: žiadne transakcie")).toBeVisible(); // D-293, revízia N-7
  });

  test("dátumy sú natívny výber dátumu a PIN je skrytý s číselnou klávesnicou", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await expect(page.getByLabel("Dátum vyhodnotenia", { exact: true })).toHaveAttribute("type", "date");
    await goTo(page, "nastavenia");
    await openDetails(page, "section#nastavenia", "PIN"); // D-293
    const pin = page.getByLabel("Nový PIN (4 až 6 číslic)");
    await expect(pin).toHaveAttribute("type", "password");
    await expect(pin).toHaveAttribute("inputmode", "numeric");
  });
});
