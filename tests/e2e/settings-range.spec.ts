import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Nastavenia: hodnoty mimo rozsahu (neoverený predpoklad, D-240) sa len upozornia; uloženie je možné.
test.describe("nastavenia: upozornenie na nezvyčajné hodnoty", () => {
  test("miera výberu a výnos mimo rozsahu zobrazia upozornenie, uloženie prejde", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("6");
    await page.getByLabel("Reálny výnos r (%)").fill("8");
    await expect(page.getByText("Miera výberu je mimo rozsahu 3–4 %, ktorý je neoverený predpoklad, nie odporúčanie.")).toBeVisible();
    await expect(page.getByText("Výnos r je mimo rozsahu 2–6 %, ktorý je neoverený predpoklad, nie odporúčanie.")).toBeVisible();
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await expect(page.getByText("Nastavenia sú uložené.")).toBeVisible();

    await page.getByLabel("Miera výberu (%)").fill("3.5");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await expect(page.getByText("Miera výberu je mimo rozsahu 3–4 %, ktorý je neoverený predpoklad, nie odporúčanie.")).toHaveCount(0);
    await expect(page.getByText("Výnos r je mimo rozsahu 2–6 %, ktorý je neoverený predpoklad, nie odporúčanie.")).toHaveCount(0);
  });
});
