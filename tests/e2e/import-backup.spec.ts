import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// D-078 a D-134: pred importom sa predvolene ponúka uloženie aktuálnych dát (zaškrtnuté); bez neho sa dáta nenávratne prepíšu.
test.describe("import zálohy – D-078, D-134", () => {
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

  test("náhľad ukazuje obsah zálohy aj aktuálnych dát a bez zaškrtávania varuje pred prepísaním", async ({ page }) => {
    const backupPath = await prepareBackup(page);
    await page.getByLabel("Súbor zálohy").setInputFiles(backupPath);
    await expect(page.getByText("Import nahradí všetky aktuálne dáta")).toBeVisible();
    await expect(page.getByLabel("Pred importom stiahnuť zálohu aktuálnych dát")).toHaveCount(0);
    await expect(page.getByText("Aktuálne dáta sa nenávratne prepíšu.")).toBeVisible();
    await expect(page.getByText(/Záloha z .* obsahuje: transakcií 0, vyhodnotení 1, /)).toBeVisible();
    await expect(page.getByText(/Teraz v zariadení: transakcií 0, vyhodnotení 1, /)).toBeVisible();
  });

  test("import nevynucuje sťahovanie zálohy; zálohu stiahne až tlačidlo Exportovať zálohu (D-143)", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    const backupPath = await prepareBackup(page);
    await page.getByLabel("Súbor zálohy").setInputFiles(backupPath);
    await expect(page.getByText("Aktuálne dáta sa nenávratne prepíšu.")).toBeVisible();

    let downloads = 0;
    page.on("download", () => {
      downloads += 1;
    });
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
    await page.waitForTimeout(500);
    expect(downloads).toBe(0);

    await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Exportovať zálohu" }).click(),
    ]);
  });

  test("posledná záloha sa zobrazí v sekcii a chybný súbor dostane slovenskú správu", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    await expect(page.getByText("Posledná záloha: zatiaľ žiadna")).toBeVisible();
    await expect(page.getByText("Záloha je staršia ako 7 dní alebo ešte nebola urobená.")).toBeVisible();

    await page.getByLabel("Súbor zálohy").setInputFiles({ name: "zla.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ app: "financna-sloboda", schemaVersion: 6, exportedAt: "2026-10-21T00:00:00Z" })) });
    await expect(page.getByText("Súbor nemá správne pole „transactions“.")).toBeVisible();
    await expect(page.getByText("Nič sa nezmenilo.")).toBeVisible();
  });
});
