import { expect, test } from "@playwright/test";
import path from "node:path";
import { goTo, openApp } from "./helpers";

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
    await goTo(page, "zaloha");
    const file = path.resolve("public/testovacia-zaloha.json");
    await page.getByLabel("Súbor zálohy").setInputFiles(file);
    await expect(page.getByText(/Záloha z .* obsahuje: transakcií 12, vyhodnotení 2, /)).toBeVisible();
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
    await goTo(page, "prehlad");
    await expect(page.locator("p", { hasText: "Posledné vyhodnotenie:" }).first()).toContainText(/\d{2}\.\d{2}\.\d{4}/);
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
    await goTo(page, "nastavenia");
    const reset = page.getByRole("button", { name: "Vrátiť východiskovú hodnotu" });
    await expect(reset).toHaveCount(0);
    await page.getByLabel("Miera výberu (%)").fill("4");
    await expect(reset).toHaveCount(1);
    await reset.click();
    await expect(page.getByLabel("Miera výberu (%)")).toHaveValue(/^3[.,]7/);
    await expect(reset).toHaveCount(0);
  });

  test("každá sekcia sa zobrazí samostatne; odkaz v paneli prepne na ňu", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await expect(page.locator("section#prehlad")).toBeVisible();
    await expect(page.locator("section#vyhodnotenie")).toHaveCount(0);
    await expect(page.getByLabel("Hodnota investícií (€)")).toHaveCount(0);
    await goTo(page, "vyhodnotenie");
    await expect(page.locator("section#prehlad")).toHaveCount(0);
    await expect(page.getByLabel("Hodnota investícií (€)")).toBeVisible();
    await page.getByRole("navigation", { name: "Hlavná navigácia" }).getByRole("link", { name: "Prehľad", exact: true }).click();
    await expect(page.locator("section#prehlad")).toBeVisible();
  });

  test("vyhodnotenie: vysvetlenie účelu a chyba, ktorá pomenuje chýbajúce pole", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await expect(page.getByText("Mesačné vyhodnotenie sa vytvára automaticky. Tu ho zadáš len na opravu. Dátum cieľa sa mení až pri vyhodnotení.", { exact: true })).toBeVisible();
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.getByText("Vyplň hodnotu investícií.")).toBeVisible();
  });

  test("nastavenia: bez ročných výdavkov sa uloženie odmietne; prázdne ostatné polia použijú východiskové hodnoty (D-118)", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await expect(page.getByText("Vyplň ročné výdavky.")).toBeVisible();
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await expect(page.getByText("Vyplň ročné výdavky.")).toHaveCount(0);
    await expect(page.getByText(/Vyplň /)).toHaveCount(0);
  });
});
