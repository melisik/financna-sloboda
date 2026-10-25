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

// Revízia 2026-10-25c, S-3: keď Safari odmietne oneskorené zdieľanie (šifrovanie), záloha sa nestiahne, ale čaká na ťuknutie.
test.describe("export zálohy, keď zdieľanie odmietne oneskorené spustenie", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __shared: { name: string; type: string }[]; __calls: number };
      w.__shared = [];
      w.__calls = 0;
      Object.defineProperty(navigator, "canShare", { value: () => true, configurable: true });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data: { files: File[] }) => {
          w.__calls += 1;
          if (w.__calls === 1) throw new DOMException("bez ťuknutia", "NotAllowedError");
          w.__shared.push({ name: data.files[0].name, type: data.files[0].type });
        },
      });
    });
  });

  test("ukáže Uložiť pripravenú zálohu a po ťuknutí ju zdieľa ako text", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    let downloaded = false;
    page.on("download", () => { downloaded = true; });
    await page.getByLabel("Heslo na šifrovanie zálohy").fill("syntetickeheslo123");
    await page.getByRole("button", { name: "Uložiť zálohu", exact: true }).click();
    await expect(page.getByText("Záloha je pripravená.")).toBeVisible();
    await page.getByRole("button", { name: "Uložiť pripravenú zálohu" }).click();
    await expect(page.getByText(/Záloha je zašifrovaná/)).toBeVisible();
    const shared = await page.evaluate(() => (window as unknown as { __shared: { name: string; type: string }[] }).__shared);
    expect(shared).toEqual([{ name: expect.stringMatching(/-sifrovana\.json$/), type: "text/plain" }]);
    expect(downloaded).toBe(false);
  });
});
