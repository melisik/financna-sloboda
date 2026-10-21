import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Nastavenia: po uložení sa ukáže potvrdenie (predtým sa neukázalo nič).
test.describe("nastavenia: potvrdenie uloženia", () => {
  test("po uložení sa zobrazí potvrdenie a hodnoty ostanú", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("4");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await page.getByLabel("Rezerva, cieľová hodnota (€)").fill("6000");
    await page.getByLabel("Prah výdavkov (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

    await expect(page.getByText("Nastavenia sú uložené.")).toBeVisible();
    await expect(page.getByLabel("Ročné výdavky pri nezávislosti (€)")).toHaveValue("24000");
  });
});
