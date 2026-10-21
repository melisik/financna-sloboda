import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

// Pripomienky od testerov (D-149): voľba GitHub alebo formulár, bez údajov z appky.
test.describe("pripomienky", () => {
  test("tlačidlo ponúkne GitHub aj formulár bez účtu", async ({ page }) => {
    await openApp(page);
    await page.getByRole("button", { name: "Nahlásiť pripomienku" }).click();
    await expect(page.getByRole("link", { name: "Nemám účet" })).toHaveAttribute("href", /docs\.google\.com\/forms\//);
    await expect(page.getByRole("link", { name: "Mám účet na GitHube" })).toHaveAttribute("href", /github\.com\/melisik\/financna-sloboda-app\/issues\/new/);
  });
});
