import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { PDFDocument, PDFTextField } from "pdf-lib";
import { goTo, openApp } from "./helpers";

// Tlačivo 17-dp-md z Majetku (D-161). Syntetické hodnoty.
test.describe("tlačivo 17-dp-md", () => {
  test("vyplnené PDF z údajov psa sa stiahne so správnymi poľami", async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    await openApp(page);
    await goTo(page, "dane");

    await page.getByRole("button", { name: "Pridať psa" }).click();
    await page.getByLabel("Obec, kde je pes chovaný").fill("Testovacia obec");
    await page.getByLabel("Ulica a číslo domu, kde je pes chovaný").fill("Hlavná 1");
    await page.getByLabel("Miesto držania psa").selectOption("rodinny_dom");
    await page.getByLabel("Účel držania psa").selectOption("domaci");
    await page.getByLabel("Dátum vzniku daňovej povinnosti").fill(today);
    await page.getByRole("button", { name: "Uložiť psa" }).click();
    await expect(page.getByText("Psov evidovaných dnes: 1")).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Vyplniť tlačivo (PDF)" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^priznanie-17-dp-md-\d{4}-\d{2}-\d{2}\.pdf$/);
    const path = await download.path();
    const form = (await PDFDocument.load(readFileSync(path!))).getForm();
    const text = (name: string) => {
      const f = form.getField(name);
      return f instanceof PDFTextField ? f.getText() : undefined;
    };
    expect(text("7_Obec")).toBe("Testovacia obec");
    expect(text("7_CisloDomu1")).toBe("Hlavná 1");
    expect(text("7_ZakladDane")).toBe("1");
  });
});
