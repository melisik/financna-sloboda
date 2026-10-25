import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Tlačivo 17-dp-md: prázdny stav, potvrdenie uloženia a náhľad (D-208). Syntetické hodnoty.
test.describe("tlačivo 17-dp-md: stav a výsledok", () => {
  test("bez nehnuteľnosti a psa je tlačidlo neaktívne a vysvetlí, čo chýba", async ({ page }) => {
    await openApp(page);
    await goTo(page, "dane");
    await expect(page.getByRole("button", { name: "Vyplniť tlačivo (PDF)" })).toHaveCount(0); // D-308: bez psa a nehnuteľnosti len veta
    await expect(page.getByText("Najprv pridaj nehnuteľnosť v Majetku alebo psa vyššie.")).toBeVisible();
  });

  test("po vyplnení sa ukáže, kam sa súbor uložil, a dá sa otvoriť náhľad", async ({ page }) => {
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

    const fill = page.getByRole("button", { name: "Vyplniť tlačivo (PDF)" });
    await expect(fill).toBeEnabled();
    const [download] = await Promise.all([page.waitForEvent("download"), (async () => { await fill.click(); await page.getByRole("button", { name: "Uložiť tlačivo (PDF)" }).click(); })()]);
    expect(download.suggestedFilename()).toBe(`priznanie-17-dp-md-${today}.pdf`);
    await expect(page.getByText(`Tlačivo je uložené ako priznanie-17-dp-md-${today}.pdf.`)).toBeVisible();
    const preview = page.getByRole("link", { name: "Otvoriť vyplnené PDF" });
    await expect(preview).toHaveAttribute("href", /^blob:/);
  });

  // Revízia 2026-10-25c, S-2: PDF vyplnené pred zmenou psa sa nesmie uložiť.
  test("po zmene psa sa pripravené PDF zahodí a treba ho vyplniť znova", async ({ page }) => {
    await openApp(page);
    await goTo(page, "dane");
    const addDog = async (obec: string) => {
      await page.getByRole("button", { name: "Pridať psa" }).click();
      await page.getByLabel("Obec, kde je pes chovaný").fill(obec);
      await page.getByLabel("Ulica a číslo domu, kde je pes chovaný").fill("Hlavná 1");
      await page.getByRole("button", { name: "Uložiť psa" }).click();
    };
    await addDog("Testovacia obec");
    await page.getByRole("button", { name: "Vyplniť tlačivo (PDF)" }).click();
    await expect(page.getByRole("button", { name: "Uložiť tlačivo (PDF)" })).toBeVisible();
    await addDog("Druhá testovacia obec");
    await expect(page.getByText("Psov evidovaných dnes: 2")).toBeVisible();
    await expect(page.getByRole("button", { name: "Uložiť tlačivo (PDF)" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Otvoriť vyplnené PDF" })).toHaveCount(0);
    await expect(page.getByText("Údaje sa zmenili, vyplň tlačivo znova.")).toBeVisible();
    await page.getByRole("button", { name: "Vyplniť tlačivo (PDF)" }).click();
    await expect(page.getByRole("button", { name: "Uložiť tlačivo (PDF)" })).toBeVisible();
    await expect(page.getByText("Údaje sa zmenili, vyplň tlačivo znova.")).toHaveCount(0);
  });
});
