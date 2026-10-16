import type { Page } from "@playwright/test";

/** Otvorí aplikáciu a preskočí sprievodcu prvým nastavením (FR-12), ak sa zobrazí. */
export async function openApp(page: Page) {
  await page.goto("/");
  const skip = page.getByRole("button", { name: "Preskočiť na hlavnú stránku" });
  await skip.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
  if (await skip.isVisible().catch(() => false)) await skip.click();
}
