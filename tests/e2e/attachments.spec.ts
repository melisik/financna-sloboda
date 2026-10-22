import { expect, test } from "@playwright/test";
import path from "node:path";
import { goTo, openApp } from "./helpers";

// Prílohy k výdavku (D-160): pridanie dokladu, kontrola typu a zmazanie. Syntetické hodnoty.
test.describe("prílohy k výdavku", () => {
  test("doklad sa pridá k výdavku, zlý typ sa odmietne a príloha sa dá zmazať", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();

    await goTo(page, "nova-transakcia");
    const row = page.locator("li", { has: page.getByRole("button", { name: "Prílohy" }) }).first();
    await row.getByRole("button", { name: "Prílohy" }).click();

    await page.getByLabel("Pridať prílohu").setInputFiles({ name: "zle.txt", mimeType: "text/plain", buffer: Buffer.from("nie je to doklad") });
    await expect(page.getByText("Príloha musí byť JPG, PNG, WEBP alebo PDF, najviac 2 MB.")).toBeVisible();

    const png = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
    await page.getByLabel("Pridať prílohu").setInputFiles({ name: "doklad-synteticky.png", mimeType: "image/png", buffer: png });
    await expect(page.getByText(/doklad-synteticky\.png/)).toBeVisible();

    await page.getByRole("button", { name: "Zmazať prílohu" }).first().click();
    await page.getByRole("button", { name: "Potvrdiť zmazanie" }).click();
    await expect(page.getByText(/doklad-synteticky\.png/)).toHaveCount(0);
  });
});
