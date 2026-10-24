import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Prehľad: dátum cieľa, pokrok a hlavná akcia na prvej obrazovke telefónu (D-283, docs/43 A1). Testovacia záloha, syntetické dáta.
test.describe("Prehľad: cieľ na prvej obrazovke", () => {
  test("dátum cieľa, pokrok, posun od minulého vyhodnotenia a Pridať transakciu sú pri 390 px bez posúvania", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.addInitScript(() => localStorage.setItem("fs-trial-note-collapsed-v1", "1"));
    await openApp(page);
    await goTo(page, "zaloha");
    await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await goTo(page, "prehlad");

    const home = page.locator("section#prehlad");
    await expect(home).toContainText(/Pokrok: \d+\s% \(.+ z .+\)/);
    await expect(home).toContainText(/Od vyhodnotenia 31\.08\.2026 sa dátum cieľa (posunul o \d+ mesiac(e|ov)? (bližšie|ďalej)|nezmenil)\./);

    for (const el of [home.locator("p", { hasText: "Dátum cieľa:" }), home.getByRole("link", { name: "Pridať transakciu" })]) {
      const box = await el.boundingBox();
      expect(box!.y + box!.height).toBeLessThanOrEqual(844);
    }
  });
});
