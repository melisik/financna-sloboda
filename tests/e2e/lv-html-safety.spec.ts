import { expect, test } from "@playwright/test";
import { goTo, openApp, openPropertyFolds } from "./helpers";

// Nahrávanie stránky listu vlastníctva (A-08): škodlivý HTML sa nespustí a veľký súbor sa neotvorí. Syntetické hodnoty.
async function openLvUpload(page: import("@playwright/test").Page) {
  await openApp(page);
  await goTo(page, "majetok");
  await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
  await openPropertyFolds(page); // D-310: bloky formulára sú zbalené
  await page.getByRole("button", { name: "Predvyplniť z listu vlastníctva" }).click();
}

test.describe("nahrávanie listu vlastníctva: bezpečnosť", () => {
  test("škodlivý HTML sa nespustí", async ({ page }) => {
    await openLvUpload(page);
    await page.getByLabel("Nahrať uloženú stránku listu vlastníctva").setInputFiles({
      name: "list-synteticky.html",
      mimeType: "text/html",
      buffer: Buffer.from('<html><body><img src="x" onerror="window.__lvPwned = true"><script>window.__lvPwned = true;</script><table><tr><td>Obec</td><td>Testovacia obec</td></tr></table></body></html>'),
    });
    expect(await page.evaluate(() => (window as Window & { __lvPwned?: boolean }).__lvPwned === true)).toBe(false);
  });

  test("príliš veľký súbor sa neotvorí a používateľ dostane hlásenie", async ({ page }) => {
    await openLvUpload(page);
    await page.getByLabel("Nahrať uloženú stránku listu vlastníctva").setInputFiles({
      name: "velky-synteticky.html",
      mimeType: "text/html",
      buffer: Buffer.alloc(2 * 1024 * 1024 + 1, "a"),
    });
    await expect(page.getByText("Súbor je väčší než 2 MB.")).toBeVisible();
  });
});
