import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Majetok: upozornenie po zmene nehnuteľnosti v K a automatické splácanie hypotéky (D-137). Syntetické hodnoty.
test.describe("majetok a hypotéka", () => {
  test("zmena nájomnej nehnuteľnosti po vyhodnotení sa oznámi vo Vyhodnotení", async ({ page }) => {
    await openApp(page);
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("0");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("300000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    await goTo(page, "vyhodnotenie");
    await expect(page.getByText("Majetok sa zmenil od posledného vyhodnotenia.")).toBeVisible();
  });

  test("mimoriadna splátka: náhľad a zápis pre zníženie splátky aj skrátenie termínu", async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByLabel("Názov (nepovinné)").fill("N15 test");
    await page.getByLabel("Režim").selectOption("vlastne_byvanie");
    await page.getByLabel("Odhad hodnoty (€)").fill("300000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByLabel("Zostatok hypotéky (€)").fill("1000");
    await page.getByLabel("Zostatok platí k (dátum)").fill(today);
    await page.getByLabel("Úroková sadzba hypotéky (% p. a.)").fill("0");
    await page.getByLabel("Mesačná splátka hypotéky (€)").fill("500");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    const card = page.locator("#majetok div", { hasText: "N15 test" }).last();
    await card.locator("summary", { hasText: "Mimoriadna splátka hypotéky" }).click();
    await card.getByLabel("Dátum splátky").fill(today);
    await card.getByLabel("Suma (€)").fill("200");
    await expect(card.getByText(/Nová splátka: 400,00 €/)).toBeVisible();
    await card.getByRole("button", { name: "Zapísať mimoriadnu splátku" }).click();
    await expect(card).toContainText("Hypotéka: 800,00 €");
    await expect(card).toContainText("400,00 €");
    await expect(card).toContainText("znížená splátka");

    await card.getByLabel("Suma (€)").fill("600");
    await card.getByLabel("Skrátiť termín (splátka ostane)").check();
    await expect(card.getByText(/termín sa skráti z 2 na 1 mesiacov/)).toBeVisible();
    await card.getByRole("button", { name: "Zapísať mimoriadnu splátku" }).click();
    await expect(card).toContainText("Hypotéka: 200,00 €");
    await expect(card).toContainText("skrátený termín");
  });

  test("hypotéka sa automaticky splatí za uplynulé mesiace", async ({ page }) => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    d.setDate(1);
    const since = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByLabel("Názov (nepovinné)").fill("hypotéka test");
    await page.getByLabel("Režim").selectOption("vlastne_byvanie");
    await page.getByLabel("Odhad hodnoty (€)").fill("300000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByLabel("Zostatok hypotéky (€)").fill("1000");
    await page.getByLabel("Zostatok platí k (dátum)").fill(since);
    await page.getByLabel("Úroková sadzba hypotéky (% p. a.)").fill("3.6");
    await page.getByLabel("Mesačná splátka hypotéky (€)").fill("500");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    const card = page.locator("#majetok div", { hasText: "hypotéka test" }).last();
    await expect(card).toContainText(/Hypotéka: \d[\d\s\u00a0]*,\d{2} €/);
  });
});
