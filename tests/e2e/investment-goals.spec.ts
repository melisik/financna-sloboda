import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, openFormFolds } from "./helpers";

// Ciele investícií: výber položiek pri tvorbe cieľa a pokrok na Prehľade (D-331). Syntetické hodnoty.
async function addPosition(page: Page, name: string, qty: string, price: string) {
  await page.getByRole("button", { name: "Pridať položku" }).click();
  await openFormFolds(page);
  await page.getByLabel("Názov alebo ticker").fill(name);
  await page.getByLabel("Počet kusov").fill(qty);
  await page.getByLabel("Cena za kus (v mene položky)").fill(price);
  await page.getByRole("button", { name: "Uložiť položku" }).click();
}

test.describe("ciele investícií (D-331)", () => {
  test("cieľ sa vytvorí s položkami hneď a pokrok je na Prehľade", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page, "ETF syntetický", "10", "50");
    await addPosition(page, "Fond syntetický", "5", "100");

    await page.getByRole("button", { name: "Pridať cieľ" }).click();
    await page.getByLabel("Názov cieľa").fill("Dôchodok");
    await page.getByLabel("Cieľová suma (€)").fill("2000");
    await page.getByRole("checkbox", { name: /ETF syntetický/ }).check();
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Dôchodok: 500,00 € · 25 % z 2\s000,00 €/)).toBeVisible();

    await goTo(page, "prehlad");
    await expect(page.getByText("Ciele investícií")).toBeVisible();
    await expect(page.getByText(/Dôchodok: 500,00 € z 2\s000,00 € · 25 %/)).toBeVisible();
    await page.getByRole("link", { name: "Investície" }).first().click();
    await expect(page.locator("#investicie")).toBeVisible();
  });

  test("jedna investícia na viac cieľov: podiely v %, pokrok sa počíta bez dvojitého započítania (D-334)", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page, "ETF syntetický", "10", "50");
    await addPosition(page, "Fond syntetický", "5", "100");
    for (const [n, pos] of [["Cieľ A", /ETF syntetický/], ["Cieľ B", /Fond syntetický/]] as const) {
      await page.getByRole("button", { name: "Pridať cieľ" }).click();
      await page.getByLabel("Názov cieľa").fill(n);
      await page.getByLabel("Cieľová suma (€)").fill("1000");
      await page.getByRole("checkbox", { name: pos }).check();
      await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    }
    // Fond (500 €) je celý v cieli B; zníž B na 60 % a zvyšných 40 % daj do cieľa A.
    await page.getByRole("button", { name: "Upraviť cieľ" }).nth(1).click();
    await page.getByLabel(/Podiel položky „Fond syntetický“ v tomto cieli/).fill("60");
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Cieľ B: 300,00 € · 30 % z 1\s000,00 €/)).toBeVisible();
    await expect(page.getByText(/Bez cieľa: 200,00 €/)).toBeVisible();
    await expect(page.getByText("Nepriradené: 40 % (200,00 €)")).toBeVisible();

    await page.getByRole("button", { name: "Upraviť cieľ" }).first().click();
    await page.getByRole("checkbox", { name: /Fond syntetický/ }).check();
    await expect(page.getByLabel(/Podiel položky „Fond syntetický“ v tomto cieli/)).toHaveValue("40");
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Cieľ A: 700,00 € · 70 % z 1\s000,00 €/)).toBeVisible();
    await expect(page.getByText(/Cieľ B: 300,00 € · 30 % z 1\s000,00 €/)).toBeVisible();
    await expect(page.getByText(/Bez cieľa/)).toHaveCount(0);
    await goTo(page, "prehlad");
    await expect(page.getByText(/Cieľ A: 700,00 € z 1\s000,00 € · 70 %/)).toBeVisible();
    await expect(page.getByText(/Cieľ B: 300,00 € z 1\s000,00 € · 30 %/)).toBeVisible();
  });

  test("cieľ „zvyšok“: všetko nepriradené patrí do Dôchodku (D-335)", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page, "ETF syntetický", "10", "50");
    await addPosition(page, "Fond syntetický", "5", "100");
    await page.getByRole("button", { name: "Pridať cieľ" }).click();
    await page.getByLabel("Názov cieľa").fill("Dôchodok");
    await page.getByLabel("Cieľová suma (€)").fill("1000");
    await page.getByRole("checkbox", { name: "Sem patrí všetko, čo nepatrí do iného cieľa" }).check();
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Dôchodok: 1\s000,00 € · cieľ dosiahnutý/)).toBeVisible();
    await expect(page.getByText(/Bez cieľa/)).toHaveCount(0);

    await page.getByRole("button", { name: "Pridať cieľ" }).click();
    await page.getByLabel("Názov cieľa").fill("Auto");
    await page.getByLabel("Cieľová suma (€)").fill("1000");
    await page.getByRole("checkbox", { name: /Fond syntetický/ }).check();
    await page.getByLabel(/Podiel položky „Fond syntetický“ v tomto cieli/).fill("40");
    await page.getByRole("button", { name: "Uložiť cieľ" }).click();
    await expect(page.getByText(/Dôchodok: 800,00 € · 80 % z 1\s000,00 €/)).toBeVisible();
    await expect(page.getByText(/Auto: 200,00 € · 20 % z 1\s000,00 €/)).toBeVisible();
    await expect(page.getByText(/Bez cieľa/)).toHaveCount(0);
    await goTo(page, "prehlad");
    await expect(page.getByText(/Dôchodok: 800,00 € z 1\s000,00 € · 80 %/)).toBeVisible();
  });

  test("súčet podielov nad 100 % sa odmietne s vysvetlením", async ({ page }) => {
    await openApp(page);
    await goTo(page, "investicie");
    await addPosition(page, "ETF syntetický", "10", "50");
    for (const n of ["Cieľ A", "Cieľ B"]) {
      await page.getByRole("button", { name: "Pridať cieľ" }).click();
      await page.getByLabel("Názov cieľa").fill(n);
      await page.getByLabel("Cieľová suma (€)").fill("1000");
      await page.getByRole("checkbox", { name: /ETF syntetický/ }).check();
      // Cieľ B ponúkne voľných 30 %; ručne zadaných 50 % je nad 100 %.
      await page.getByLabel(/Podiel položky „ETF syntetický“ v tomto cieli/).fill(n === "Cieľ A" ? "70" : "50");
      await page.getByRole("button", { name: "Uložiť cieľ" }).click();
      if (n === "Cieľ B") await expect(page.getByText(/Súčet podielov položky „ETF syntetický“ v cieľoch je nad 100 %/)).toBeVisible();
    }
  });

  test("bez cieľov Prehľad blok nemá", async ({ page }) => {
    await openApp(page);
    await expect(page.getByText("Ciele investícií")).toHaveCount(0);
  });
});
