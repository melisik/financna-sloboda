import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Šifrovaná záloha (N-05, D-276): export s heslom, import s heslom a odmietnutie zlého hesla. Syntetické hodnoty.
test.describe("šifrovaná záloha (N-05)", () => {
  test("export s heslom nezapíše čitateľné dáta a obnova vyžaduje správne heslo", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "zaloha");
    await page.getByLabel("Heslo na šifrovanie zálohy").fill("heslo-na-zalohu-1");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Exportovať zálohu" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/-sifrovana\.json$/);
    const backupPath = await download.path();
    const content = readFileSync(backupPath!, "utf8");
    expect(content).toContain('"encrypted":true');
    expect(content).not.toContain('"transactions"');

    // Zlé heslo: chyba, nič sa nenačíta.
    await page.getByLabel("Súbor zálohy").setInputFiles(backupPath!);
    await expect(page.getByLabel("Heslo k záložnému súboru")).toBeVisible();
    await page.getByLabel("Heslo k záložnému súboru").fill("zle-heslo-000");
    await page.getByRole("button", { name: "Otvoriť zálohu" }).click();
    await expect(page.getByText("Heslo nesedí alebo je súbor poškodený. Nič sa nezmenilo.")).toBeVisible();

    // Správne heslo: náhľad, potom zrušenie bez zmeny dát.
    await page.getByLabel("Heslo k záložnému súboru").fill("heslo-na-zalohu-1");
    await page.getByRole("button", { name: "Otvoriť zálohu" }).click();
    await expect(page.getByText("Import nahradí všetky aktuálne dáta")).toBeVisible();
    await page.getByRole("button", { name: "Zrušiť" }).click();
    await expect(page.getByText("Import nahradí všetky aktuálne dáta")).toHaveCount(0);
  });

  test("krátke heslo na export sa odmietne", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    await page.getByLabel("Heslo na šifrovanie zálohy").fill("kratke");
    await page.getByRole("button", { name: "Exportovať zálohu" }).click();
    await expect(page.getByText("Heslo musí mať aspoň 8 znakov. Nič sa neexportovalo.")).toBeVisible();
  });
});
