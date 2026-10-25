import { expect, test } from "@playwright/test";
import { goTo, openApp, openDetails } from "./helpers";

// Obmedzenie pokusov pri PIN-e (audit, nález 10). Syntetické hodnoty.
test.describe("PIN: obmedzenie pokusov", () => {
  test("po piatich nesprávnych pokusoch sa odomknutie zablokuje a blok prežije obnovenie stránky", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    await openDetails(page, "section#nastavenia", "PIN"); // D-293: PIN je zbalený
    await page.getByLabel("Nový PIN (4 až 6 číslic)").fill("1234");
    await page.getByLabel("Zopakuj PIN").fill("1234");
    await page.getByRole("button", { name: "Zapnúť PIN" }).click();
    await expect(page.getByRole("button", { name: "Vypnúť PIN" })).toBeVisible();

    await page.reload();
    await expect(page.getByText("Zadaj PIN")).toBeVisible();
    const unlock = page.getByRole("button", { name: "Odomknúť" });
    const pin = page.getByLabel("PIN", { exact: true });
    for (let i = 0; i < 5; i++) {
      await pin.fill("0000");
      await unlock.click();
      await expect(pin).toHaveValue("");
    }
    await expect(unlock).toBeDisabled();
    await expect(page.getByText(/Príliš veľa pokusov\. Skús znova o \d+ s\./)).toBeVisible();

    await page.reload();
    await expect(page.getByText("Zadaj PIN")).toBeVisible();
    await expect(page.getByRole("button", { name: "Odomknúť" })).toBeDisabled();
    await expect(page.getByText(/Príliš veľa pokusov/)).toBeVisible();
  });
});
