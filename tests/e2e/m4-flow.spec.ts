import { expect, test, type Page } from "@playwright/test";
import { openApp } from "./helpers";

// M4 (roadmapa, výstupné kritérium): E2E tok „transakcia → vyhodnotenie → dátum“.
// FR-02/FR-10: dátum cieľa sa mení len pri vyhodnotení; transakcia zobrazí len predbežný dopad.

async function setupGoalAndEvaluation(page: Page) {
  await openApp(page);
  await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
  await page.getByLabel("Miera výberu (%)").fill("4");
  await page.getByLabel("Reálny výnos r (%)").fill("3.5");
  await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
  await page.getByLabel("Prah výdavkov (€)").fill("100");
  await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
  await page.getByLabel("Dátum vyhodnotenia (RRRR-MM-DD)").fill("2026-10-01");
  await page.getByLabel("Hodnota investícií (€)").fill("100000");
  await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
  await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
  await expect(page.getByText("Posledné vyhodnotenie:").first()).toBeVisible();
}

/** Text riadku „Dátum cieľa: …“ na domovskej obrazovke. */
async function goalDateText(page: Page): Promise<string> {
  return (await page.locator("p", { hasText: "Dátum cieľa:" }).first().innerText()).trim();
}

test.describe("M4 – tok transakcia → vyhodnotenie → dátum", () => {
  test("transakcia len ukáže predbežný dopad; nové vyhodnotenie aktualizuje dátum cieľa", async ({ page }) => {
    await setupGoalAndEvaluation(page);
    const before = await goalDateText(page);

    // Transakcia po D_L: investícia 500 €
    await page.getByLabel("Typ transakcie").selectOption("investicia");
    await page.getByLabel("Dátum (RRRR-MM-DD)").fill("2026-10-05");
    await page.getByLabel("Suma (€)").fill("500");
    await expect(page.getByText(/Predbežný dopad:/).first()).toBeVisible();
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("investícia · 500 €").first()).toBeVisible();

    // Dátum cieľa sa transakciou nemení (FR-02)
    expect(await goalDateText(page)).toBe(before);

    // Nové vyhodnotenie k 2026-10-15 s vyššou hodnotou investícií (dátum nesmie byť v budúcnosti, M2)
    await page.getByLabel("Dátum vyhodnotenia (RRRR-MM-DD)").fill("2026-10-15");
    await page.getByLabel("Hodnota investícií (€)").fill("120000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.locator("p", { hasText: "Posledné vyhodnotenie:" }).first()).toContainText("2026-10-15");

    // Dátum cieľa sa po vyhodnotení aktualizuje
    expect(await goalDateText(page)).not.toBe(before);
  });
});
