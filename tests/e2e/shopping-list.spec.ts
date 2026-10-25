import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Nákupný zoznam v Sklade (D-302, docs/51 etapa 2). Syntetické názvy.
async function addStock(page: Page, name: string, qty: string, unit: string, min?: string) {
  const s = page.locator("section#sklad");
  await s.getByRole("button", { name: "Pridať položku skladu" }).click();
  await s.getByLabel("Názov (napr. mlieko)").fill(name);
  await s.getByLabel("Množstvo").fill(qty);
  await s.getByLabel("Jednotka").selectOption(unit);
  if (min) await s.getByLabel("Minimálna zásoba (nepovinné)").fill(min);
  await s.getByRole("button", { name: "Uložiť položku" }).click();
}

test.describe("nákupný zoznam", () => {
  test("ručné pridanie, kúpené, do skladu a poslanie textu", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");
    const s = page.locator("section#sklad");
    await s.getByLabel("Pridať na zoznam").fill("Syntetický chlieb");
    await s.getByRole("button", { name: "Pridať", exact: true }).click();
    await s.getByLabel("Pridať na zoznam").fill("Syntetické maslo");
    await s.getByRole("button", { name: "Pridať", exact: true }).click();
    await s.getByRole("button", { name: "Poslať zoznam" }).click();
    await expect(s.getByLabel("Text zoznamu")).toHaveValue("Nakúpiť:\n- Syntetický chlieb\n- Syntetické maslo");
    await s.getByRole("checkbox", { name: "Syntetický chlieb" }).click();
    await expect(s.getByRole("checkbox", { name: "Syntetický chlieb" })).toBeChecked();
    await s.getByRole("button", { name: "Do skladu: Syntetický chlieb" }).click();
    await expect(s.getByLabel("Názov (napr. mlieko)")).toHaveValue("Syntetický chlieb");
    await s.getByLabel("Množstvo").fill("1");
    await s.getByRole("button", { name: "Uložiť položku" }).click();
    await expect(s.getByRole("checkbox", { name: "Syntetický chlieb" })).toHaveCount(0);
    await expect(s.getByText("1 ks")).toBeVisible();
    await s.getByRole("checkbox", { name: "Syntetické maslo" }).click();
    await expect(s.getByRole("checkbox", { name: "Syntetické maslo" })).toBeChecked();
    await s.getByRole("button", { name: "Odstrániť kúpené" }).click();
    await expect(s.getByRole("checkbox", { name: "Syntetické maslo" })).toHaveCount(0);
  });

  test("keď položka dôjde alebo klesne pod minimálnu zásobu, appka ju raz ponúkne na zoznam", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");
    const s = page.locator("section#sklad");
    await addStock(page, "Syntetické mlieko", "1", "l");
    await s.locator("div", { hasText: "Syntetické mlieko" }).getByRole("button", { name: "Vyhodiť" }).last().click();
    await s.getByRole("button", { name: "Potvrdiť vyhodenie" }).click();
    await expect(s.getByText("Došlo alebo je pod minimálnou zásobou: Syntetické mlieko.")).toBeVisible();
    await s.getByRole("button", { name: "Pridať na zoznam", exact: true }).click();
    await expect(s.getByRole("checkbox", { name: "Syntetické mlieko" })).toBeVisible();

    await addStock(page, "Syntetická múka", "3", "kg", "2");
    await s.locator("div", { hasText: "Syntetická múka" }).getByRole("button", { name: "Vyhodiť" }).last().click();
    await s.getByLabel("Vyhodiť množstvo").fill("2");
    await s.getByRole("button", { name: "Potvrdiť vyhodenie" }).click();
    await expect(s.getByText("Došlo alebo je pod minimálnou zásobou: Syntetická múka.")).toBeVisible();
    await s.getByRole("button", { name: "Nie", exact: true }).click();
    await expect(s.getByText(/Došlo alebo je pod minimálnou zásobou/)).toHaveCount(0);
    await expect(s.getByRole("checkbox", { name: "Syntetická múka" })).toHaveCount(0);
  });

  test("chýbajúce suroviny receptu na zoznam", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");
    const s = page.locator("section#sklad");
    await addStock(page, "Syntetické mlieko", "0.2", "l");
    await s.getByRole("button", { name: "Pridať recept" }).click();
    await s.getByLabel("Názov receptu").fill("Syntetické palacinky");
    await s.getByLabel("Surovina").selectOption({ label: "Syntetické mlieko (l)" });
    await s.getByLabel("Množstvo suroviny").fill("0.5");
    await s.getByRole("button", { name: "Uložiť recept" }).click();
    await s.getByRole("button", { name: "Chýbajúce na zoznam" }).click();
    await expect(s.getByRole("checkbox", { name: "Syntetické mlieko" })).toBeVisible();
    await expect(s.getByText("0,3 l")).toBeVisible();
  });
});
