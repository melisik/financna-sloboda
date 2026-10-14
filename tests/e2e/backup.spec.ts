import { expect, test } from "@playwright/test";

test.describe("záloha v UI (FR-17, FR-18)", () => {
  test("export stiahne súbor; neplatný import nič nezmení; platný import čaká na potvrdenie", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await page.getByLabel("Typ transakcie").selectOption("sporenie");
    await page.getByLabel("Suma (€)").fill("250");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 250 €")).toBeVisible();

    // Export: stiahne sa súbor so správnym názvom.
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Exportovať zálohu" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^financna-sloboda-zaloha-\d{4}-\d{2}-\d{2}\.json$/);
    const backupPath = await download.path();

    // Neplatný JSON: chyba a dáta ostanú.
    await page.getByLabel("Súbor zálohy").setInputFiles({ name: "zlo.json", mimeType: "application/json", buffer: Buffer.from("nie je to json") });
    await expect(page.getByText("Súbor nie je platný JSON. Nič sa nezmenilo.")).toBeVisible();
    await expect(page.getByText("sporenie (do hotovosti) · 250 €")).toBeVisible();

    // Platná záloha: náhľad, bez potvrdenia sa nič nezmení.
    await page.getByLabel("Súbor zálohy").setInputFiles(backupPath!);
    await expect(page.getByText("Import nahradí všetky aktuálne dáta")).toBeVisible();
    await page.getByRole("button", { name: "Zrušiť" }).click();
    await expect(page.getByText("Import nahradí všetky aktuálne dáta")).toHaveCount(0);
  });
});
