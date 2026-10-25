import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Export na zariadení so zdieľaním (iPhone): zdieľací list namiesto stiahnutia. Syntetické hodnoty.
test.describe("export zálohy so zdieľaním", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __shared: string[] }).__shared = [];
      Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: { files: File[] }) => {
          (window as unknown as { __shared: string[] }).__shared.push(data.files[0].name);
        },
      });
    });
  });

  test("export ponúkne zdieľací list a záloha sa uloží", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    await page.getByRole("button", { name: "Uložiť zálohu" }).click();
    await expect(page.getByText("Záloha je uložená podľa tvojho výberu.")).toBeVisible();
    const shared = await page.evaluate(() => (window as unknown as { __shared: string[] }).__shared);
    expect(shared).toHaveLength(1);
    expect(shared[0]).toMatch(/^financna-sloboda-zaloha-\d{4}-\d{2}-\d{2}\.json$/);
  });
});
