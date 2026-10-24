import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Zbaliteľný pruh „Skúšobná verzia“ (D-281, docs/42, variant A). Obsah podľa D-144 sa nemení.
const note = (page: Page) => page.getByRole("note").filter({ hasText: "Skúšobná verzia" });

test.describe("pruh Skúšobná verzia", () => {
  test("pri prvom otvorení je rozbalený; po Rozumiem, zbaliť ostane zbalený aj po obnovení a súhrn ho znova rozbalí", async ({ page }) => {
    await openApp(page);
    await expect(note(page).getByText(/bez záruky/)).toBeVisible();
    await note(page).getByRole("button", { name: "Rozumiem, zbaliť" }).click();
    await expect(note(page).getByText(/bez záruky/)).toBeHidden();
    await expect(note(page).getByText("Skúšobná verzia: údaje sú len v tomto zariadení, ukladaj si zálohu.")).toBeVisible();

    await page.reload();
    await expect(page.locator("section#prehlad")).toBeVisible();
    await expect(note(page).getByText(/bez záruky/)).toBeHidden();

    await note(page).getByText("Skúšobná verzia: údaje sú len v tomto zariadení, ukladaj si zálohu.").click();
    await expect(note(page).getByText(/bez záruky/)).toBeVisible();
  });

  test("odkaz Záloha v pruhu otvorí sekciu zálohy; v sekcii Záloha ani na obrazovkách bez menu sa nezobrazí", async ({ page }) => {
    // Sprievodca prvým nastavením nemá menu, odkaz by nič neotvoril.
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Preskočiť na hlavnú stránku" })).toBeVisible();
    await expect(note(page).getByRole("link", { name: "Záloha" })).toHaveCount(0);
    await openApp(page);
    await note(page).getByRole("link", { name: "Záloha" }).click();
    await expect(page.locator("section#zaloha")).toBeVisible();
    await expect(note(page).getByRole("link", { name: "Záloha" })).toHaveCount(0);
  });

  test("zbalený pruh: pri 390 px začína menu najviac na 170 px a stránka nemá vodorovný presah", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await note(page).getByRole("button", { name: "Rozumiem, zbaliť" }).click();
    await goTo(page, "nova-transakcia");
    const top = await page.getByRole("navigation", { name: "Hlavná navigácia" }).evaluate((el) => el.parentElement!.getBoundingClientRect().top);
    expect(top).toBeLessThanOrEqual(170);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  });
});
