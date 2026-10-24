import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Vývoj v čase na Prehľade (D-289, docs/44: U1, A, N1). Testovacia záloha, syntetické dáta.
async function loadBackup(page: Page, backup: unknown) {
  await openApp(page);
  await goTo(page, "zaloha");
  await page.getByLabel("Súbor zálohy").setInputFiles({ name: "zaloha.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
  await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
  await goTo(page, "nastavenia");
  await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
  await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
  await goTo(page, "prehlad");
}
const testBackup = () => JSON.parse(readFileSync(path.resolve("public/testovacia-zaloha.json"), "utf8"));

test.describe("vývoj v čase", () => {
  test("je zbalený; po otvorení graf s popisom, veta o posune a tabuľka so všetkými vyhodnoteniami", async ({ page }) => {
    await loadBackup(page, testBackup());
    const home = page.locator("section#prehlad");
    const chart = home.getByRole("img", { name: /Kapitál pri vyhodnotení/ });
    await expect(chart).toBeHidden();
    await home.locator("summary", { hasText: "Vývoj" }).click();
    await expect(chart).toBeVisible();
    await expect(home).toContainText(/Od vyhodnotenia 31\.08\.2026 sa dátum cieľa (posunul o \d+ mesiac(e|ov)? (bližšie|ďalej) \(z \d\d\/\d{4} na \d\d\/\d{4}\)|nezmenil)/);
    await expect(home).not.toContainText("Nehnuteľnosti v prenájme v ňom nie sú");
    await home.locator("summary", { hasText: "Tabuľka" }).click();
    await expect(home.locator("table tbody tr")).toHaveCount(2);

    const results = await new AxeBuilder({ page }).include("section#prehlad").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.help}`);
    expect(serious, serious.join("\n")).toEqual([]);

    await page.setViewportSize({ width: 320, height: 700 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);

    // Oprava textu v Ročnom prehľade (docs/44, oddiel 7): dátum cieľa zahŕňa nehnuteľnosti v prenájme (D-169).
    await goTo(page, "rocny-prehlad");
    await expect(page.locator("section#rocny-prehlad")).toContainText("z dnešných hodnôt nehnuteľností v prenájme");
  });

  test("s jedným vyhodnotením ukáže namiesto grafu oznam", async ({ page }) => {
    const backup = testBackup();
    backup.snapshots = backup.snapshots.slice(-1);
    await loadBackup(page, backup);
    const home = page.locator("section#prehlad");
    await home.locator("summary", { hasText: "Vývoj" }).click();
    await expect(home.getByText("Vývoj sa ukáže po druhom vyhodnotení.")).toBeVisible();
    await expect(home.getByRole("img", { name: /Kapitál pri vyhodnotení/ })).toHaveCount(0);
  });

  test("pri nehnuteľnosti v prenájme graf vysvetlí, že ju neobsahuje (N1)", async ({ page }) => {
    const backup = testBackup();
    backup.properties = [{
      id: "p-rent", name: "Byt syntetický", mode: "prenajom", valueCents: 15_000_000, valueDate: "2026-09-30",
      mortgageBalanceCents: 5_000_000, balanceDate: "2026-09-30", mortgageRate: 0.04, monthlyPaymentCents: 40_000,
      monthlyRentCents: 60_000, createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-01T10:00:00Z",
    }];
    await loadBackup(page, backup);
    const home = page.locator("section#prehlad");
    await home.locator("summary", { hasText: "Vývoj" }).click();
    await expect(home).toContainText("Graf ukazuje investície a hotovosť. Nehnuteľnosti v prenájme v ňom nie sú, lebo ich minulé hodnoty sa neukladajú; pokrok na Prehľade ich zahŕňa.");
  });
});
