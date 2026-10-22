import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Prílohy k výdavku z prenájmu (D-221): doklad sa pridá k výdavku a zmizne spolu s ním. Syntetické hodnoty.
test.describe("prílohy k výdavku z prenájmu", () => {
  test("doklad sa pridá k výdavku z prenájmu, zlý typ sa odmietne a výdavok sa dá zmazať aj s dokladom", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByLabel("Názov (nepovinné)").fill("Byt prílohy prenájom");
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("150000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    const card = page.locator("#majetok div", { hasText: "Byt prílohy prenájom" }).last();
    await card.getByLabel("Druh záznamu").selectOption("vydavok");
    await card.getByLabel("Suma (€) – prenájom").fill("35");
    await card.getByRole("button", { name: "Pridať záznam" }).click();
    await expect(card.getByText("Doklady", { exact: true })).toBeVisible();

    await card.getByText("Doklady", { exact: true }).click();
    await card.getByLabel("Pridať prílohu").setInputFiles({ name: "zle.txt", mimeType: "text/plain", buffer: Buffer.from("nie je to doklad") });
    await expect(card.getByText("Príloha musí byť JPG, PNG, WEBP alebo PDF, najviac 2 MB.")).toBeVisible();

    await card.getByLabel("Pridať prílohu").setInputFiles({ name: "doklad-prenajom-synteticky.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 synteticky") });
    await expect(card.getByText(/doklad-prenajom-synteticky\.pdf/)).toBeVisible();

    const row = card.locator("li", { hasText: "výdavok" });
    await row.getByRole("button", { name: "Zmazať", exact: true }).click();
    await row.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(card.getByText("Doklady", { exact: true })).toHaveCount(0);
  });
});
