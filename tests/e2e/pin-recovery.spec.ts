import { expect, test } from "@playwright/test";
import { goTo, openApp, openDetails } from "./helpers";

// Zabudnutý PIN: vymazanie dát v zariadení po dvojitom potvrdení (D-135). Syntetické hodnoty.
test.describe("PIN: zabudnutý PIN", () => {
  test("zabudnutý PIN vymaže dáta a zruší PIN až po potvrdení", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nastavenia");
    await openDetails(page, "section#nastavenia", "PIN"); // D-293: PIN je zbalený
    await page.getByLabel("Nový PIN (4 až 6 číslic)").fill("1234");
    await page.getByLabel("Zopakuj PIN").fill("1234");
    await page.getByRole("button", { name: "Zapnúť PIN" }).click();
    await expect(page.getByRole("button", { name: "Vypnúť PIN" })).toBeVisible();

    await page.reload();
    await expect(page.getByText("Zadaj PIN")).toBeVisible();
    await page.getByRole("button", { name: "Zabudol som PIN" }).click();
    const wipe = page.getByRole("button", { name: "Vymazať údaje a zrušiť PIN" });
    await expect(wipe).toBeDisabled();
    await page.getByLabel("Rozumiem, že údaje v tomto zariadení sa vymažú").check();
    await expect(wipe).toBeEnabled();
    await wipe.click();

    await expect(page.getByText("Zadaj PIN")).toHaveCount(0);
    const skip = page.getByRole("button", { name: "Preskočiť na hlavnú stránku" });
    if (await skip.isVisible().catch(() => false)) await skip.click();
    await goTo(page, "prehlad");
    await expect(page.getByText("Urob prvé vyhodnotenie")).toBeVisible();
    await goTo(page, "nastavenia");
    await openDetails(page, "section#nastavenia", "PIN");
    await expect(page.getByRole("button", { name: "Zapnúť PIN" })).toBeVisible();
  });
});
