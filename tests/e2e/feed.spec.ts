import { expect, test } from "@playwright/test";
import path from "node:path";
import { goTo, openApp } from "./helpers";

// D-112: import súboru od integračnej služby; nič sa nevolá zo siete. Syntetické údaje.
const feed = path.resolve("tests/fixtures/integracia-syntetika.json");

test.describe("import súboru integračnej služby (D-112)", () => {
  test("náhľad, potvrdenie a opätovný import nahradí položky zdroja bez duplicít", async ({ page }) => {
    await openApp(page);
    await goTo(page, "prijmy");
    await page.getByLabel("Súbor od integračnej služby").setInputFiles(feed);
    await expect(page.getByText(/Položiek: 2\./)).toBeVisible();
    await page.getByRole("button", { name: "Importovať" }).click();
    await expect(page.getByText("starobný dôchodok (výhľad)")).toBeVisible();
    await expect(page.getByText("Zdroj: Integračná služba (syntetické), získané 2026-10-19")).toHaveCount(2);

    // Opätovný import toho istého zdroja nesmie zdvojiť položky.
    await page.getByLabel("Súbor od integračnej služby").setInputFiles(feed);
    await page.getByRole("button", { name: "Importovať" }).click();
    await expect(page.getByText("starobný dôchodok (výhľad)")).toHaveCount(1);
    await expect(page.getByText("ošetrovné")).toHaveCount(1);
  });

  test("neplatný súbor zobrazí chybu a nič sa neimportuje", async ({ page }) => {
    await openApp(page);
    await goTo(page, "prijmy");
    await page.getByLabel("Súbor od integračnej služby").setInputFiles({ name: "zle.json", mimeType: "application/json", buffer: Buffer.from("nie je to json") });
    await expect(page.getByText("Súbor nie je platný JSON. Nič sa nezmenilo.")).toBeVisible();
    await expect(page.getByText("Zatiaľ nie je zapísaný žiadny pravidelný príjem.")).toBeVisible();
  });
});
