import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Výpis s viacerými byty v tvare portálu (popis a hodnota v jednej bunke, hodnota v odkaze): výber bytu ako pri D-214. Syntetický súbor.
test.describe("výber bytu z listu vlastníctva v tvare portálu", () => {
  test("pri viacerých bytoch appka neberie prvý potichu, ale ukáže výber", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByRole("button", { name: "Predvyplniť z listu vlastníctva" }).click();
    await page.getByLabel("Nahrať uloženú stránku listu vlastníctva").setInputFiles(path.resolve("tests/fixtures/lv-synthetic-viac-bytov-portal.html"));

    await expect(page.getByText("V liste je 2 bytov. Vyber svoj v zozname.")).toBeVisible();
    const select = page.getByLabel("Byt v liste vlastníctva");
    await expect(select.locator("option")).toHaveCount(2);
    await expect(page.getByLabel("Číslo bytu (nepovinné)")).toHaveValue("12");
    await expect(page.getByLabel("Podlahová plocha (m², nepovinné)")).toHaveValue("45");

    await select.selectOption("1");
    await expect(page.getByLabel("Číslo bytu (nepovinné)")).toHaveValue("13");
    await expect(page.getByLabel("Podlahová plocha (m², nepovinné)")).toHaveValue("30");
    await expect(page.getByLabel("Súpisné číslo (nepovinné)")).toHaveValue("77");
    await expect(page.getByLabel("Obec (pre daň z nehnuteľností, nepovinné)")).toHaveValue("Testovacia obec");
    await expect(page.getByLabel("Katastrálne územie (nepovinné)")).toHaveValue("Testovo");
  });
});
