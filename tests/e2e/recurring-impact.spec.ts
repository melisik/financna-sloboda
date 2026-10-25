import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, TEST_NOW } from "./helpers";

// Opakované výdavky a dátum cieľa v sekcii Mesačný výdavok (D-290, docs/45: U1, V3, S1). Testovacia záloha, syntetické dáta.
async function loadBackup(page: Page, backup: unknown) {
  await page.clock.setFixedTime(TEST_NOW); // revízia V-1: okno priemeru sa počíta z dneška, záloha má pevné dátumy
  await openApp(page);
  await goTo(page, "zaloha");
  await page.getByLabel("Súbor zálohy").setInputFiles({ name: "zaloha.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
  await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
  await goTo(page, "nastavenia");
  await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
  await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
  await goTo(page, "mesacny-vydavok");
}
const testBackup = () => JSON.parse(readFileSync(path.resolve("public/testovacia-zaloha.json"), "utf8"));

test.describe("opakované výdavky a dátum cieľa", () => {
  test("zoznam v skupinách: nie nevyhnutné pred nevyhnutnými; pravidelné aj priemery kategórií; vecný úvod", async ({ page }) => {
    await loadBackup(page, testBackup());
    const block = page.getByRole("region", { name: "Opakované výdavky a dátum cieľa" });
    await expect(block).toBeVisible();
    await expect(block).toContainText("Odhad pred daňou, po poplatkoch, ak ich zadáš, nie odporúčanie.");
    const headings = await block.getByRole("heading", { level: 4 }).allInnerTexts();
    expect(headings[0]).toBe("Nie nevyhnutné");
    expect(headings.at(-1)).toBe("Nevyhnutné");
    await expect(block.getByRole("listitem").filter({ hasText: "Nájom" })).toContainText(/pravidelný · 650,00\s€ mesačne/);
    await expect(block.getByRole("listitem").filter({ hasText: "Nájom" })).toContainText(/o \d+ mesiac(e|ov)? skôr/);
    await expect(block.getByRole("listitem").filter({ hasText: "jedlo" })).toContainText("priemer za 3 mesiace");
    await expect(block.getByRole("listitem").filter({ hasText: "Poistenie domácnosti" })).toContainText(/120,00\s€ ročne/);

    const results = await new AxeBuilder({ page }).include("section#mesacny-vydavok").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => `${v.id}: ${v.help}`);
    expect(serious, serious.join("\n")).toEqual([]);
    await page.setViewportSize({ width: 320, height: 700 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });

  test("pri kratšej histórii ukáže len pravidelné výdavky a oznam o priemeroch", async ({ page }) => {
    const backup = testBackup();
    backup.transactions = backup.transactions.filter((t: { date: string }) => t.date >= "2026-09-01");
    await loadBackup(page, backup);
    const block = page.getByRole("region", { name: "Opakované výdavky a dátum cieľa" });
    await expect(block).toContainText("Priemery kategórií sa ukážu, keď budú zapísané výdavky aspoň za 3 celé mesiace.");
    await expect(block.getByRole("listitem").filter({ hasText: "Nájom" })).toBeVisible();
    await expect(block.getByText("priemer za 3 mesiace")).toHaveCount(0);
  });
});
