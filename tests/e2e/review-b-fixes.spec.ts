import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, TEST_NOW } from "./helpers";

// Opravy po externej revízii 2026-10-25 (b), D-300. Syntetické dáta.
async function withBackup(page: Page) {
  await page.clock.setFixedTime(TEST_NOW);
  await openApp(page);
  await goTo(page, "zaloha");
  await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
  await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
  await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
}

test.describe("opravy po revízii 2026-10-25 (b)", () => {
  test("S-1: po uložení aj po Zrušiť úpravu je formulár späť na výdavok z príjmu", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");
    await s.getByLabel("Suma (€)").fill("20");
    await s.getByLabel("Zdroj úhrady").selectOption("z_hotovosti");
    await s.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(s.getByLabel("Zdroj úhrady")).toHaveValue("z_prijmu");
    await s.getByRole("button", { name: "Upraviť" }).first().click();
    await s.getByLabel("Zdroj úhrady").selectOption("z_investicii");
    await s.getByRole("button", { name: "Zrušiť úpravu" }).click();
    await expect(s.getByLabel("Typ transakcie")).toHaveValue("vydavok");
    await expect(s.getByLabel("Zdroj úhrady")).toHaveValue("z_prijmu");
  });

  test("S-2: zbalený Doklad ukáže v súhrne nesúlad súčtu a nerozpoznané riadky", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");
    await s.getByLabel("Suma (€)").fill("10");
    await s.locator("summary", { hasText: "Doklad" }).click();
    await s.getByLabel("Položky z dokladu").fill(["100000001 Syntetický rožok", "1,000x\t23%\t3,50 €"].join("\n"));
    await expect(s.getByText(/Súčet položiek sa nezhoduje/)).toBeVisible();
    await s.locator("summary", { hasText: "Doklad" }).click();
    await expect(s.locator("summary", { hasText: "Doklad" })).toContainText("súčet nesedí");
    await s.getByLabel("Suma (€)").fill("11");
    await expect(s.locator("summary", { hasText: "Doklad" })).toContainText("súčet nesedí");
  });

  test.describe("S-3: skener bez knižnice", () => {
    test.use({ serviceWorkers: "block" });
    test("kamera aj fotka povedia, že sa nenačítal skener, nie že chýba kamera", async ({ page }) => {
      await page.route(/\/assets\/esm-[^/]*\.js$/, (r) => r.abort());
      await openApp(page);
      await goTo(page, "sklad");
      await page.getByRole("button", { name: "Pridať položku skladu" }).click();
      await page.getByRole("button", { name: "Skenovať kódom kamerou" }).click();
      await expect(page.getByText("Skener sa nepodarilo načítať bez siete. Otvor Sklad raz s pripojením na internet.")).toBeVisible();
      await expect(page.getByText(/Povoľ ju v prehliadači/)).toHaveCount(0);
      await page.getByRole("button", { name: "Zrušiť" }).first().click();
      await page.getByLabel("Fotka obalu").setInputFiles({ name: "obal.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64") });
      await expect(page.getByText(/Skener sa nepodarilo načítať bez siete/)).toBeVisible();
    });
  });

  test("N-2: skener zavretý počas pýtania povolenia kameru hneď vypne", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __gum: boolean; __stopped: boolean; __resolve?: () => void };
      w.__gum = false;
      w.__stopped = false;
      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: () => new Promise((resolve) => {
          w.__gum = true;
          w.__resolve = () => resolve({ getTracks: () => [{ stop: () => { w.__stopped = true; } }] });
        }),
      });
    });
    await openApp(page);
    await goTo(page, "sklad");
    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByRole("button", { name: "Skenovať kódom kamerou" }).click();
    await page.waitForFunction(() => (window as unknown as { __gum: boolean }).__gum);
    await page.getByRole("button", { name: "Zrušiť" }).first().click();
    await page.evaluate(() => (window as unknown as { __resolve: () => void }).__resolve());
    await page.waitForFunction(() => (window as unknown as { __stopped: boolean }).__stopped);
  });

  test("N-1: pri chýbajúcom potvrdení vyčerpania investícií sa políčko zameria", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");
    await s.getByLabel("Suma (€)").fill("1000000");
    await s.getByLabel("Zdroj úhrady").selectOption("z_investicii");
    await s.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(s.getByRole("checkbox", { name: /Rozumiem, investície sa vyčerpajú/ })).toBeFocused();
  });

  test("N-5, N-6, N-9: poplatky, graf Vývoj a tykanie v pripomienkach", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "scenar-vydavku");
    await expect(page.locator("section#scenar-vydavku")).toContainText("Odhad je pred daňou, po poplatkoch, ak ich zadáš, a nie je finančným poradenstvom.");
    await goTo(page, "prehlad");
    await page.locator("section#prehlad summary", { hasText: "Vývoj" }).click();
    await expect(page.locator("section#prehlad")).toContainText("Body sú vyhodnotenia v poradí, nie časová os.");
    await expect(page.getByText(/Nepíšte/)).toHaveCount(0);
  });
});
