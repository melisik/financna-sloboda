import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Rýchlejšie zadanie výdavku (D-286, docs/43 A3). Syntetické hodnoty.
test.describe("zadanie výdavku a história (A3)", () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await goTo(page, "nova-transakcia");
  });

  test("suma je prvé pole a doklad je zbalený, kým ho neotvorím", async ({ page }) => {
    const form = page.locator("section#nova-transakcia");
    const firstLabel = await form.locator("input, select, textarea").first().evaluate((el) => el.closest("label")?.textContent ?? el.getAttribute("aria-label"));
    expect(firstLabel).toMatch(/^Suma \(€\)/);

    await expect(form.getByLabel("Fotka QR kódu dokladu")).toBeHidden();
    await expect(form.getByLabel("Položky z dokladu")).toBeHidden();
    await form.getByRole("button", { name: "Nákup po položkách" }).click();
    await form.locator("summary", { hasText: "Doklad" }).click();
    await expect(form.getByLabel("Položky z dokladu")).toBeVisible();
  });

  test("v histórii je pri zázname len Upraviť; Prílohy a Zmazať sú v úprave a zmazanie sa dá vrátiť", async ({ page }) => {
    const form = page.locator("section#nova-transakcia");
    await form.getByLabel("Suma (€)").fill("40");
    await form.getByRole("button", { name: "Uložiť transakciu" }).click();
    const row = form.locator("li", { hasText: "výdavok · 40,00 €" });
    await expect(row).toBeVisible();
    await expect(row.getByRole("button")).toHaveCount(1);
    await expect(row.getByRole("button", { name: "Upraviť" })).toBeVisible();

    await row.getByRole("button", { name: "Upraviť" }).click();
    // Úprava je hore vo formulári; stránka sa posunie na začiatok, aby ju bolo vidieť.
    await expect(form.getByRole("heading", { name: "Úprava transakcie" })).toBeInViewport();
    await expect(form.getByRole("heading", { name: "Prílohy" })).toBeVisible();

    await form.getByRole("button", { name: "Zmazať transakciu" }).click();
    await form.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(form.getByText("Transakcia bola zmazaná.")).toBeInViewport();
    await expect(form.locator("li", { hasText: "výdavok · 40,00 €" })).toHaveCount(0);
    await form.getByRole("button", { name: "Vrátiť späť" }).click();
    await expect(form.locator("li", { hasText: "výdavok · 40,00 €" })).toBeVisible();
  });

  test("Uložiť a predbežný dopad sú pri 390 aj 320 px na obrazovke bez posúvania (D-287, P1)", async ({ page }) => {
    // Predbežný dopad potrebuje cieľ, teda ročné výdavky v Nastaveniach.
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await goTo(page, "nova-transakcia");
    const form = page.locator("section#nova-transakcia");
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await form.getByLabel("Suma (€)").fill("12");
      await expect(form.getByRole("button", { name: "Uložiť transakciu" })).toBeInViewport();
      await expect(form.getByText("Predbežný dopad:")).toBeInViewport();
    }
  });

  test("nový výdavok má predvolený zdroj z príjmu (D-014, D-288)", async ({ page }) => {
    await expect(page.locator("section#nova-transakcia").getByLabel("Zdroj úhrady")).toHaveValue("z_prijmu");
  });
});

