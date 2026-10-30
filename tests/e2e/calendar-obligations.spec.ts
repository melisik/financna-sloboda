import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

/** Finančný kalendár (D-342): navigácia, pridanie a zaplatenie jednorazovej povinnosti. */

test.describe("Finančný kalendár (D-342)", () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
  });

  test("sekcia je dostupná cez navigáciu a zobrazuje mesačný prehľad", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = page.locator("section#financny-kalendar");
    await expect(section).toBeVisible();
    await expect(section.getByRole("strong").filter({ hasText: /^\d/ }).first()).toBeVisible(); // Mesiac
    await expect(section.getByRole("button", { name: "◀" })).toBeVisible();
    await expect(section.getByRole("button", { name: "▶" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Tento mesiac" })).toBeVisible();
  });

  test("navigácia medzi mesiacmi funguje", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = page.locator("section#financny-kalendar");
    const monthLabel = section.locator("strong").filter({ hasText: /\d{4}/ }).first();
    const before = await monthLabel.textContent();
    await section.getByRole("button", { name: "◀" }).click();
    const after = await monthLabel.textContent();
    expect(before).not.toBe(after);
    await section.getByRole("button", { name: "Tento mesiac" }).click();
    expect(await monthLabel.textContent()).toBe(before);
  });

  test("pridanie jednorazovej povinnosti", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = page.locator("section#financny-kalendar");

    await section.getByRole("button", { name: "+ Pridať jednorazovú povinnosť" }).click();
    await expect(section.getByRole("heading", { name: "Nová povinnosť" })).toBeVisible();

    await section.getByLabel("Názov (napr. Poistenie auta)").fill("Test povinnosť");
    await section.getByLabel("Suma (€)").fill("99");
    // dátum splatnosti – predvolená hodnota
    await section.locator("select").selectOption("iné");
    await section.getByRole("button", { name: "Uložiť" }).click();

    await expect(section.locator("li", { hasText: "Test povinnosť" })).toBeVisible();
    await expect(section.getByRole("button", { name: "Zaplatené" })).toBeVisible();
  });

  test("označenie povinnosti ako zaplatená", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = page.locator("section#financny-kalendar");

    // Pridaj povinnosť
    await section.getByRole("button", { name: "+ Pridať jednorazovú povinnosť" }).click();
    await section.getByLabel("Názov (napr. Poistenie auta)").fill("Poistenie");
    await section.getByLabel("Suma (€)").fill("50");
    await section.locator("select").selectOption("iné");
    await section.getByRole("button", { name: "Uložiť" }).click();

    const row = section.locator("li", { hasText: "Poistenie" });
    await row.getByRole("button", { name: "Zaplatené" }).click();
    await expect(row.getByText("zaplatené")).toBeVisible();
    await expect(row.getByRole("button", { name: "Zrušiť" })).toBeVisible();
  });

  test("zrušenie platby povinnosti", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = page.locator("section#financny-kalendar");

    await section.getByRole("button", { name: "+ Pridať jednorazovú povinnosť" }).click();
    await section.getByLabel("Názov (napr. Poistenie auta)").fill("Záloha");
    await section.getByLabel("Suma (€)").fill("30");
    await section.locator("select").selectOption("iné");
    await section.getByRole("button", { name: "Uložiť" }).click();

    const row = section.locator("li", { hasText: "Záloha" });
    await row.getByRole("button", { name: "Zaplatené" }).click();
    await row.getByRole("button", { name: "Zrušiť" }).click();
    await expect(row.getByRole("button", { name: "Zaplatené" })).toBeVisible();
    await expect(row.getByRole("button", { name: "Zrušiť" })).toHaveCount(0);
  });

  test("zmazanie jednorazovej povinnosti", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = page.locator("section#financny-kalendar");

    await section.getByRole("button", { name: "+ Pridať jednorazovú povinnosť" }).click();
    await section.getByLabel("Názov (napr. Poistenie auta)").fill("Na zmazanie");
    await section.getByLabel("Suma (€)").fill("10");
    await section.locator("select").selectOption("iné");
    await section.getByRole("button", { name: "Uložiť" }).click();

    const row = section.locator("li", { hasText: "Na zmazanie" });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Zmazať" }).click();
    await expect(section.locator("li", { hasText: "Na zmazanie" })).toHaveCount(0);
  });

  test("formulár nevypočíta chybné vstupy", async ({ page }) => {
    await goTo(page, "financny-kalendar");
    const section = page.locator("section#financny-kalendar");
    await section.getByRole("button", { name: "+ Pridať jednorazovú povinnosť" }).click();
    // prázdne meno
    await section.getByRole("button", { name: "Uložiť" }).click();
    await expect(section.getByRole("alert")).toBeVisible();
    // zrušiť
    await section.getByRole("button", { name: "Zrušiť" }).click();
    await expect(section.getByRole("heading", { name: "Nová povinnosť" })).toHaveCount(0);
  });
});
