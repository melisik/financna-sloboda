import { expect, test } from "@playwright/test";
import path from "node:path";
import { openApp } from "./helpers";

// M7 (návod v appke) a príprava na pilot: testovacia záloha (syntetické dáta) sa dá stiahnuť a importovať.
test.describe("testovateľnosť: návod a testovacia záloha", () => {
  test("návod je v appke a obsahuje odkaz na testovaciu zálohu", async ({ page }) => {
    await openApp(page);
    const guide = page.locator("details#navod");
    await expect(guide.locator("summary", { hasText: "Návod" })).toBeVisible();
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

  test("bez dát sa nezobrazí výzva na zálohu; navigácia je na telefóne v jednom riadku", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await expect(page.getByText("Záloha ešte nebola exportovaná")).toHaveCount(0);
    const box = await page.getByRole("navigation", { name: "Hlavná navigácia" }).boundingBox();
    expect(box?.height ?? 999).toBeLessThan(60);
  });

  test("tlačidlo vrátiť východiskovú hodnotu sa ukáže len pri hodnote, ktorá sa líši (FR-13)", async ({ page }) => {
    await openApp(page);
    const reset = page.getByRole("button", { name: "Vrátiť východiskovú hodnotu" });
    await expect(reset).toHaveCount(0);
    await page.getByLabel("Miera výberu (%)").fill("4");
    await expect(reset).toHaveCount(1);
    await reset.click();
    await expect(page.getByLabel("Miera výberu (%)")).toHaveValue(/^3[.,]7/);
    await expect(reset).toHaveCount(0);
  });

  test("zbalené sekcie: pri štarte je otvorený len Prehľad; odkaz v paneli otvorí svoju sekciu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Preskočiť na hlavnú stránku" }).click();
    await expect(page.locator("details#prehlad")).toHaveJSProperty("open", true);
    await expect(page.locator("details#vyhodnotenie")).toHaveJSProperty("open", false);
    await page.getByRole("navigation", { name: "Hlavná navigácia" }).getByRole("link", { name: "Vyhodnotenie" }).click();
    await expect(page.locator("details#vyhodnotenie")).toHaveJSProperty("open", true);
    await expect(page.getByLabel("Hodnota investícií (€)")).toBeVisible();
  });

  test("vyhodnotenie: vysvetlenie účelu a chyba, ktorá pomenuje chýbajúce pole", async ({ page }) => {
    await openApp(page);
    await expect(page.getByText("Na konci mesiaca zadaj hodnotu investícií a hotovosť. Dátum cieľa sa zmení až po tomto kroku.", { exact: true })).toBeVisible();
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.getByText("Vyplň hodnotu investícií.")).toBeVisible();
  });

  test("nastavenia: chyba vymenúva len chýbajúce polia", async ({ page }) => {
    await openApp(page);
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await expect(page.getByText("Vyplň výnos, rezervu, prah.")).toBeVisible();
  });
});
