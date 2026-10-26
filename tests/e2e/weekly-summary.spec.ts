import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { openApp } from "./helpers";

// Týždenný súhrn výdavkov (N-10): uloží sa ako textový súbor, nič sa neodosiela. Syntetické hodnoty.
test.describe("týždenný súhrn výdavkov", () => {
  test("tlačidlo uloží textový súbor s obdobím a súčtom", async ({ page }) => {
    await openApp(page);
    await expect(page.getByText("Týždenný súhrn", { exact: true })).toBeVisible();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Uložiť týždenný súhrn" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^compaven-tyzden-\d{4}-\d{2}-\d{2}\.txt$/);
    const text = await readFile((await download.path())!, "utf8");
    expect(text).toContain("Týždenný súhrn výdavkov");
    expect(text).toContain("Výdavky spolu: 0,00 €");
    expect(text).toContain("neukladaj ho do verejných priečinkov");
  });
});
