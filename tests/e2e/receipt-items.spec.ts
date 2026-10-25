import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Položky nákupu (D-129, D-313) a návrhy z predchádzajúcich nákupov (docs/58, D-318). Syntetické názvy.
test.describe("položky nákupu", () => {
  test("položky sa uložia k výdavku, pri úprave sa zobrazia a pri ďalšom nákupe sa ponúknu s cenou", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByRole("button", { name: "Nákup po položkách" }).click();
    const t = page.locator("section#nova-transakcia");
    for (const [name, qty, price] of [["Testovací výrobok A", "1", "3.5"], ["Výrobok C", "2", "5.75"]]) {
      await t.getByLabel("Položka", { exact: true }).fill(name);
      await t.getByLabel("Množstvo", { exact: true }).fill(qty);
      await t.getByLabel("Cena za kus (€)").fill(price);
      await t.getByRole("button", { name: "Pridať položku" }).click();
    }
    // Suma sa nezadáva; je súčtom položiek (D-313).
    await expect(page.getByText("Spolu: 15,00 €")).toBeVisible();
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();

    await expect(page.locator("section#nova-transakcia li", { hasText: "položiek: 2" })).toBeVisible();
    await page.getByRole("button", { name: "Upraviť" }).first().click();
    await expect(page.getByRole("button", { name: "Odstrániť položku Výrobok C" })).toBeVisible();
    await expect(page.getByText("Spolu: 15,00 €")).toBeVisible();

    await page.getByRole("button", { name: "Zrušiť úpravu" }).click();
    // Návrh: rovnaký názov doplní poslednú cenu za kus (docs/58, D).
    await t.getByRole("button", { name: "Nákup po položkách" }).click();
    await expect(t.locator("datalist#navrhy-poloziek option[value='Výrobok C']")).toHaveCount(1);
    await t.getByLabel("Položka", { exact: true }).fill("Výrobok C");
    await expect(t.getByLabel("Cena za kus (€)")).toHaveValue("5.75");
  });
});
