import { expect, test } from "@playwright/test";
import path from "node:path";
import { goTo, openApp } from "./helpers";

// Pripomienka ročnej kontroly nastavení (N-13, D-151). Syntetické hodnoty.
test.describe("pripomienka kontroly nastavení", () => {
  test("záloha bez dátumu kontroly ukáže pripomienku; uloženie nastavení ju zruší", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();

    await goTo(page, "prehlad");
    await expect(page.getByText("Nastavenia sa ešte neoverili alebo sú staršie ako rok.")).toBeVisible();

    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "prehlad");
    await expect(page.getByText("Nastavenia sa ešte neoverili alebo sú staršie ako rok.")).toHaveCount(0);
  });
});
