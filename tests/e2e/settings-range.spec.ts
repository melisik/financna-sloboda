import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Nastavenia: hodnoty mimo bežného rozsahu sa len upozornia; uloženie je možné (rozsahy z docs/00).
test.describe("nastavenia: upozornenie na nezvyčajné hodnoty", () => {
  test("miera výberu a výnos mimo rozsahu zobrazia upozornenie, uloženie prejde", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByLabel("Miera výberu (%)").fill("6");
    await page.getByLabel("Reálny výnos r (%)").fill("8");
    await expect(page.getByText("Miera výberu je mimo bežného rozsahu 3–4 %.")).toBeVisible();
    await expect(page.getByText("Výnos r je mimo bežného rozsahu 2–6 %.")).toBeVisible();
    await page.getByRole("button", { name: "Uložiť nastavenia" }).click();
    await expect(page.getByText("Nastavenia sú uložené.")).toBeVisible();

    await page.getByLabel("Miera výberu (%)").fill("3.5");
    await page.getByLabel("Reálny výnos r (%)").fill("3.5");
    await expect(page.getByText("Miera výberu je mimo bežného rozsahu 3–4 %.")).toHaveCount(0);
    await expect(page.getByText("Výnos r je mimo bežného rozsahu 2–6 %.")).toHaveCount(0);
  });
});
