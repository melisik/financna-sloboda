import { expect, test } from "@playwright/test";
import path from "node:path";
import { openApp } from "./helpers";

// M7 (návod v appke) a príprava na pilot: testovacia záloha (syntetické dáta) sa dá stiahnuť a importovať.
test.describe("testovateľnosť: návod a testovacia záloha", () => {
  test("návod je v appke a obsahuje odkaz na testovaciu zálohu", async ({ page }) => {
    await openApp(page);
    const guide = page.locator("details#navod");
    await expect(guide.locator("summary", { hasText: "Návod" })).toBeVisible();
    await guide.locator("summary").click();
    await expect(guide.getByText("Prvé nastavenie:")).toBeVisible();
    await expect(guide.locator('a[href="./testovacia-zaloha.json"]')).toBeVisible();
  });

  test("import testovacej zálohy nahradí dáta a obnoví domovskú obrazovku", async ({ page }) => {
    await openApp(page);
    const file = path.resolve("public/testovacia-zaloha.json");
    await page.getByLabel("Súbor zálohy").setInputFiles(file);
    await expect(page.getByText(/Záloha z .*: 3 transakcií, 1 vyhodnotení\./)).toBeVisible();
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
    await expect(page.locator("p", { hasText: "Posledné vyhodnotenie:" }).first()).toContainText("2026-09-30");
    await expect(page.locator("p", { hasText: "Dátum cieľa:" }).first()).toBeVisible();
  });
});
