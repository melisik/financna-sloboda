import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export type SectionId = "prehlad" | "nova-transakcia" | "vyhodnotenie" | "nastavenia" | "zaloha";

/** Prepne na sekciu kliknutím v hornom paneli (zobrazí sa len táto sekcia, D-099). */
export async function goTo(page: Page, id: SectionId) {
  await page.getByRole("navigation", { name: "Hlavná navigácia" }).locator(`a[href="#${id}"]`).click();
  await expect(page.locator(`section#${id}`)).toBeVisible();
}

/** Otvorí aplikáciu, preskočí sprievodcu prvým nastavením (FR-12) a ostane na Prehľade. */
export async function openApp(page: Page) {
  await page.goto("/");
  const skip = page.getByRole("button", { name: "Preskočiť na hlavnú stránku" });
  await skip.waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await expect(page.locator("section#prehlad")).toBeVisible();
}
