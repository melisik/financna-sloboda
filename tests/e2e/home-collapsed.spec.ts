import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

// Podrobnosti na Prehľade sú zbalené a otvoria sa až po rozkliknutí (D-098). Syntetické hodnoty.
test.describe("zbalené podrobnosti na Prehľade (D-098)", () => {
  test("podrobnosti sú pri otvorení zbalené a rozklik ich otvorí", async ({ page }) => {
    await openApp(page);
    const details = page.locator("section#prehlad details");
    expect(await details.count()).toBeGreaterThan(0);
    await expect(page.locator("section#prehlad details[open]")).toHaveCount(0);
    await details.first().locator("summary").click();
    await expect(details.first()).toHaveAttribute("open", "");
  });
});
