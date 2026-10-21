import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Recepty a odpočet skladu (D-127). Syntetické hodnoty.
test.describe("recepty a sklad", () => {
  test("uvarenie odpočíta suroviny; nedostatok zablokuje odpočet a sklad ostane nezmenený", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");

    const addItem = async (name: string, qty: string, unit: string) => {
      await page.getByRole("button", { name: "Pridať položku skladu" }).click();
      await page.getByLabel("Názov (napr. mlieko)").fill(name);
      await page.getByLabel("Množstvo").fill(qty);
      await page.getByLabel("Jednotka").selectOption(unit);
      await page.getByRole("button", { name: "Uložiť položku" }).click();
    };
    await addItem("Mlieko", "2", "l");
    await addItem("Ryža", "500", "g");

    await page.getByRole("button", { name: "Pridať recept" }).click();
    await page.getByLabel("Názov receptu").fill("Kaša");
    await page.getByLabel("Surovina", { exact: true }).nth(0).selectOption({ label: "Mlieko (l)" });
    await page.getByLabel("Množstvo suroviny").nth(0).fill("0.5");
    await page.getByRole("button", { name: "Pridať surovinu" }).click();
    await page.getByLabel("Surovina", { exact: true }).nth(1).selectOption({ label: "Ryža (g)" });
    await page.getByLabel("Množstvo suroviny").nth(1).fill("100");
    await page.getByRole("button", { name: "Uložiť recept" }).click();

    const porridge = page.locator("section#sklad div", { hasText: "Kaša" }).last();
    await porridge.getByRole("button", { name: "Uvariť" }).click();
    await page.getByRole("button", { name: "Odpočítať zo skladu" }).click();
    await expect(page.getByText("Uvarené: „Kaša“")).toBeVisible();
    await expect(page.locator("section#sklad p", { hasText: /^1\.5 l$/ })).toBeVisible();
    await expect(page.locator("section#sklad p", { hasText: /^400 g$/ })).toBeVisible();

    await page.getByRole("button", { name: "Pridať recept" }).click();
    await page.getByLabel("Názov receptu").fill("Rizoto");
    await page.getByLabel("Surovina", { exact: true }).nth(0).selectOption({ label: "Ryža (g)" });
    await page.getByLabel("Množstvo suroviny").nth(0).fill("1000");
    await page.getByRole("button", { name: "Uložiť recept" }).click();

    const risotto = page.locator("section#sklad div", { hasText: "Rizoto" }).last();
    await risotto.getByRole("button", { name: "Uvariť" }).click();
    await expect(page.getByText("sklad ostáva bez zmeny. Ryža: chýba 600 g.")).toBeVisible();
    await expect(page.locator("section#sklad p", { hasText: /^400 g$/ })).toBeVisible();
  });

  test("uvarenie najprv ukáže, čo sa odpočíta; zrušenie nechá sklad; zmazaná surovina sa pomenuje", async ({ page }) => {
    await openApp(page);
    await goTo(page, "sklad");
    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByLabel("Názov (napr. mlieko)").fill("Mlieko");
    await page.getByLabel("Množstvo").fill("2");
    await page.getByLabel("Jednotka").selectOption("l");
    await page.getByRole("button", { name: "Uložiť položku" }).click();

    await page.getByRole("button", { name: "Pridať recept" }).click();
    await page.getByLabel("Názov receptu").fill("Kaša");
    await page.getByLabel("Surovina", { exact: true }).nth(0).selectOption({ label: "Mlieko (l)" });
    await expect(page.getByText("Množstvo (l)")).toBeVisible();
    await page.getByLabel("Množstvo suroviny").nth(0).fill("0.5");
    await page.getByRole("button", { name: "Uložiť recept" }).click();

    const porridge = page.locator("section#sklad div", { hasText: "Kaša" }).last();
    await porridge.getByRole("button", { name: "Uvariť" }).click();
    await expect(page.getByText("Uvariť „Kaša“?")).toBeVisible();
    await expect(page.getByText("Mlieko: −0,5 l")).toBeVisible();
    await page.getByRole("button", { name: "Zrušiť", exact: true }).click();
    await expect(page.locator("section#sklad p", { hasText: /^2 l$/ })).toBeVisible();

    await porridge.getByRole("button", { name: "Uvariť" }).click();
    await page.getByRole("button", { name: "Odpočítať zo skladu" }).click();
    await expect(page.locator("section#sklad p", { hasText: /^1\.5 l$/ })).toBeVisible();

    const milk = page.locator("section#sklad section > div", { has: page.locator("strong", { hasText: /^Mlieko$/ }) });
    await milk.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(page.getByText("Používa ju recept: Kaša.")).toBeVisible();
    await milk.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(page.getByText("Mlieko už nie je v sklade, upravte recept")).toBeVisible();

    await porridge.getByRole("button", { name: "Uvariť" }).click();
    await expect(page.getByText(/sklad ostáva bez zmeny\. „Mlieko“ už nie je v sklade/)).toBeVisible();
  });
});
