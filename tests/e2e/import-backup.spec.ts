import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-078: záloha pri importe sa stiahne len na výslovné zaškrtnutie používateľom; inak sa nesťahuje.
test.describe("import zálohy – D-078", () => {
  async function prepareBackup(page: import("@playwright/test").Page) {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "zaloha");
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Exportovať zálohu" }).click(),
    ]);
    return (await download.path())!;
  }

  test("bez zaškrtnutia sa pri importe záloha nestiahne", async ({ page }) => {
    const backupPath = await prepareBackup(page);
    await page.getByLabel("Súbor zálohy").setInputFiles(backupPath);
    await expect(page.getByText("Import nahradí všetky aktuálne dáta")).toBeVisible();
    await expect(page.getByLabel("Pred importom stiahnuť zálohu aktuálnych dát")).not.toBeChecked();

    let downloads = 0;
    page.on("download", () => {
      downloads += 1;
    });
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
    await page.waitForTimeout(500);
    expect(downloads).toBe(0);
  });

  test("so zaškrtnutím sa záloha stiahne pred nahradením", async ({ page }) => {
    const backupPath = await prepareBackup(page);
    await page.getByLabel("Súbor zálohy").setInputFiles(backupPath);
    await page.getByLabel("Pred importom stiahnuť zálohu aktuálnych dát").check();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^financna-sloboda-zaloha-\d{4}-\d{2}-\d{2}\.json$/);
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
  });
});
