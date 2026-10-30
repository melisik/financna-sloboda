import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

/** D-345: deň splatnosti pravidelného výdavku sa pri úprave nestratí. Syntetické údaje. */

test("úprava pravidelného výdavku zachová deň splatnosti a neplatný deň sa odmietne", async ({ page }) => {
  await openApp(page);
  await goTo(page, "pravidelne-vydavky");
  const s = page.locator("section#pravidelne-vydavky");
  await s.getByRole("button", { name: "Pridať pravidelný výdavok" }).click();
  await s.getByLabel("Názov (napr. predplatné)").fill("Splátka test");
  await s.getByLabel("Suma mesačne (€)").fill("80");
  await s.getByLabel("Od", { exact: true }).fill("2026-01-01");
  await s.getByLabel("Deň splatnosti v mesiaci (nepovinné)").fill("32");
  await s.getByRole("button", { name: "Uložiť výdavok" }).click();
  await expect(s.getByText("Deň splatnosti musí byť celé číslo od 1 do 31.")).toBeVisible();
  await s.getByLabel("Deň splatnosti v mesiaci (nepovinné)").fill("31");
  await s.getByRole("button", { name: "Uložiť výdavok" }).click();
  await expect(s).toContainText("splatnosť 31. v mesiaci");

  await s.getByRole("button", { name: "Upraviť" }).first().click();
  await expect(s.getByLabel("Deň splatnosti v mesiaci (nepovinné)")).toHaveValue("31");
  await s.getByLabel("Suma mesačne (€)").fill("90");
  await s.getByRole("button", { name: "Uložiť výdavok" }).click();
  await expect(s).toContainText("splatnosť 31. v mesiaci");

  await page.reload();
  await goTo(page, "pravidelne-vydavky");
  await expect(page.locator("section#pravidelne-vydavky")).toContainText("splatnosť 31. v mesiaci");
});
