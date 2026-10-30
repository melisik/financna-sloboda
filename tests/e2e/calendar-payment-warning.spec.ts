import { expect, test } from "@playwright/test";
import { goTo, localIsoDay, openApp } from "./helpers";

/** D-345: pri potvrdení platby pravidelnej povinnosti kalendár upozorní, že sa platba do rozpočtu nezapočíta druhýkrát. Syntetické údaje. */

test("potvrdenie platby pravidelnej povinnosti upozorní na rozpočet; bez potvrdenia ostane nezaplatená", async ({ page }) => {
  const name = "Nájom upozornenie";
  await openApp(page);
  await goTo(page, "pravidelne-vydavky");
  const rec = page.locator("section#pravidelne-vydavky");
  await rec.getByRole("button", { name: "Pridať pravidelný výdavok" }).click();
  await rec.getByLabel("Názov (napr. predplatné)").fill(name);
  await rec.getByLabel("Kategória pravidelného výdavku").selectOption("bývanie");
  await rec.getByLabel("Suma mesačne (€)").fill("50");
  await rec.getByLabel("Od", { exact: true }).fill("2026-01-01");
  await rec.getByLabel("Deň splatnosti v mesiaci (nepovinné)").fill(String(Number(localIsoDay(0).slice(8, 10))));
  await rec.getByRole("button", { name: "Uložiť výdavok" }).click();
  await expect(rec.getByText(name)).toBeVisible();

  await goTo(page, "financny-kalendar");
  const cal = page.locator("section#financny-kalendar");
  const row = cal.locator("li", { hasText: name });
  await row.getByRole("button", { name: "Zaplatené" }).click();
  const panel = cal.getByRole("group", { name: "Potvrdenie vytvorenia transakcie" });
  await expect(panel).toContainText("nezapočíta druhýkrát");
  await expect(panel).toContainText("zníži kapitál");
  await panel.getByRole("button", { name: "Zrušiť", exact: true }).click();
  await expect(panel).toHaveCount(0);
  await expect(row).toContainText("čaká na úhradu");
  await expect(row.getByRole("button", { name: "Zaplatené" })).toBeVisible();
});
