import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

test.describe("záloha v UI (FR-17, FR-18)", () => {
  test("export stiahne súbor; neplatný import nič nezmení; platný import čaká na potvrdenie", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Typ transakcie").selectOption("sporenie");
    await page.getByLabel(/^Suma \((€|EUR)\)$/).fill("250");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 250,00 €")).toBeVisible();

    await goTo(page, "zaloha");
    // Export: stiahne sa súbor so správnym názvom.
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Uložiť zálohu" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^financna-sloboda-zaloha-\d{4}-\d{2}-\d{2}\.json$/);
    const backupPath = await download.path();

    // Neplatný JSON: chyba a dáta ostanú.
    await page.getByLabel("Súbor zálohy").setInputFiles({ name: "zlo.json", mimeType: "application/json", buffer: Buffer.from("nie je to json") });
    await expect(page.getByText("Súbor nie je platný JSON. Nič sa nezmenilo.")).toBeVisible();
    await goTo(page, "nova-transakcia");
    await expect(page.getByText("sporenie (do hotovosti) · 250,00 €")).toBeVisible();

    // Platná záloha: náhľad, bez potvrdenia sa nič nezmení.
    await goTo(page, "zaloha");
    await page.getByLabel("Súbor zálohy").setInputFiles(backupPath!);
    await expect(page.getByText("Import nahradí všetky aktuálne dáta")).toBeVisible();
    await page.getByRole("button", { name: "Zrušiť" }).click();
    await expect(page.getByText("Import nahradí všetky aktuálne dáta")).toHaveCount(0);
  });

  test("na počítači stiahne zálohu aj pri dostupnom Web Share API", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          Object.defineProperty(window, "__backupShareCalled", { configurable: true, value: true });
        },
      });
    });
    await openApp(page);
    await goTo(page, "zaloha");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Uložiť zálohu" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^financna-sloboda-zaloha-\d{4}-\d{2}-\d{2}\.json$/);
    expect(await page.evaluate(() => Reflect.get(window, "__backupShareCalled"))).toBeUndefined();
    await expect(page.getByText(/Záloha sa stiahla/)).toBeVisible();
  });

  test("na iPhone použije systémové zdieľanie zálohy", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "userAgent", {
        configurable: true,
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      });
      Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
      Object.defineProperty(navigator, "canShare", { configurable: true, value: () => true });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          Object.defineProperty(window, "__backupShareCalled", { configurable: true, value: true });
        },
      });
    });
    await openApp(page);
    await goTo(page, "zaloha");
    await page.getByRole("button", { name: "Uložiť zálohu" }).click();
    await expect(page.getByText(/Záloha je uložená podľa tvojho výberu/)).toBeVisible();
    expect(await page.evaluate(() => Reflect.get(window, "__backupShareCalled"))).toBe(true);
  });
});
