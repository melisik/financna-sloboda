import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

// Demo režim (D-343): keď je VITE_DEMO=1, zobrazí sa DemoNotice a TrialNotice sa nesmie zobraziť.
// Testovacie zostavenie má VITE_DEMO nezapnuté, preto tieto testy overujú štandardný (nie-demo) režim.

test.describe("demo režim vypnutý (štandardné testovanie)", () => {
  test("bez demo režimu sa zobrazí pruh Skúšobná verzia", async ({ page }) => {
    await openApp(page);
    await expect(page.getByRole("note").filter({ hasText: "Skúšobná verzia" })).toBeVisible();
    await expect(page.getByRole("note", { name: "Demo režim" })).toHaveCount(0);
  });

  test("bez demo režimu nie je viditeľný oznam o ukážkových dátach", async ({ page }) => {
    await openApp(page);
    await expect(page.getByText("ukážkové dáta")).toHaveCount(0);
  });
});
