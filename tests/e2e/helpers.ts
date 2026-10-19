import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Otvorí všetky zbalené sekcie (testy pracujú s formulármi v nich). */
export async function expandAll(page: Page) {
  await page.locator("details#prehlad").waitFor({ state: "attached" });
  await page.evaluate(() => {
    document.querySelectorAll("details").forEach((d) => {
      d.open = true;
    });
  });
}

/** Otvorí aplikáciu, preskočí sprievodcu prvým nastavením (FR-12) a otvorí sekcie. */
export async function openApp(page: Page) {
  await page.goto("/");
  const skip = page.getByRole("button", { name: "Preskočiť na hlavnú stránku" });
  await skip.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expandAll(page);
  await expect(page.locator("details#prehlad")).toBeAttached();
}
