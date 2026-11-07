import { expect, test } from "@playwright/test";
import { goTo, localIsoDay, openApp, openPropertyFolds } from "./helpers";

// Mesačná bilancia domácnosti (D-346), scenár A zadaný cez UI: mzda 2 000 €, prijatý nájom 500 €,
// hypotéka 600 €, výdavok na prenájom 100 €, ostatné výdavky 1 000 € → +800 € na Prehľade aj v Príjmoch. Syntetické hodnoty.
const sum = (text: string) => new RegExp(text.replace(/ /g, "\\D?"));

test.describe("mesačná bilancia s prenájmom", () => {
  test("Prehľad, Príjmy a Rozpočet ukazujú rovnaké príjmy, výdavky a rozdiel", async ({ page }) => {
    const today = localIsoDay(0);
    await openApp(page);

    await goTo(page, "prijmy");
    await page.getByRole("button", { name: "Pridať pravidelný príjem" }).click();
    await page.getByLabel("Názov (napr. mzda)").fill("Mzda test");
    await page.getByLabel("Suma mesačne (€)").fill("2000");
    await page.getByLabel("Od", { exact: true }).fill("2026-01-01");
    await page.getByRole("button", { name: "Uložiť príjem" }).click();

    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await openPropertyFolds(page);
    await page.getByLabel("Názov (nepovinné)").fill("Byt na prenájom");
    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("200000");
    await page.getByLabel("Dátum odhadu").fill(today);
    await page.getByLabel("Mesačný nájom (€, nepovinné)").fill("500");
    await page.getByLabel("Zostatok hypotéky (€)").fill("100000");
    await page.getByLabel("Zostatok platí k (dátum)").fill(today);
    await page.getByLabel("Mesačná splátka hypotéky (€)").fill("600");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();

    const card = page.locator("#majetok div", { hasText: "Byt na prenájom" }).last();
    await card.getByLabel("Suma (€) – prenájom").fill("500");
    await card.getByRole("button", { name: "Pridať záznam" }).click();
    await expect(card).toContainText("prijatý nájom 500,00 €", { timeout: 15000 });
    await card.getByLabel("Druh záznamu").selectOption("vydavok");
    await card.getByLabel("Suma (€) – prenájom").fill("100");
    await card.getByRole("button", { name: "Pridať záznam" }).click();
    await expect(card).toContainText("výdavky 100,00 €, zápisov 2.", { timeout: 15000 });

    // Transakcia sa dá zapísať až po vyhodnotení.
    await goTo(page, "vyhodnotenie");
    await page.getByLabel("Dátum vyhodnotenia", { exact: true }).fill("2026-01-01");
    await page.getByLabel("Hodnota investícií (€)").fill("300000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("1000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Suma (€)").fill("1000");
    await page.getByLabel("Kategória").selectOption("jedlo");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();

    await goTo(page, "prehlad");
    await expect(page.getByText(sum("Príjmy: 2 500,00 € · výdavky: 1 700,00 € · rozdiel: \\+800,00 €"))).toBeVisible();
    await expect(page.getByText(sum("Z príjmov: pravidelné 2 000,00 €, prijatý nájom 500,00 €."))).toBeVisible();
    await page.getByText("Rozpis výdavkov ▾", { exact: true }).click();
    await expect(page.getByText(sum("Splátky hypoték \\(v bývaní\\): 600,00 €"))).toBeVisible();
    await expect(page.getByText(sum("Výdavky na prenájom \\(evidencia v Majetku\\): 100,00 €"))).toBeVisible();
    await expect(page.getByText("Možný dvojitý zápis")).toHaveCount(0);

    await goTo(page, "prijmy");
    await expect(page.getByText(sum("Mesačný príjem: 2 500,00 € · minuté tento mesiac: 1 700,00 €"))).toBeVisible();
    await expect(page.getByText(/Rozdiel: \+800,00 €/)).toBeVisible();
    await expect(page.getByText(/Plán z Majetku \(len informácia/)).toBeVisible();

    await goTo(page, "rozpocet");
    await expect(page.getByText(sum("minuté 600,00 € \\(z toho splátky hypoték 600,00 €\\)"))).toBeVisible();
    await expect(page.getByText(sum("mimo kategórií a limitov\\): 100,00 €"))).toBeVisible();
  });
});
