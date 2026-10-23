import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { groupOf } from "../../src/app/navigation";

export type SectionId = "prehlad" | "nova-transakcia" | "prijmy" | "rozpocet" | "vyhodnotenie" | "majetok" | "zavazky" | "investicie" | "pravidelne-vydavky" | "dane" | "sklad" | "rocny-prehlad" | "nastavenia" | "zaloha";

/**
 * Prepne na sekciu cez horný panel (D-205). Sekcia je odkaz len v aktívnej skupine,
 * preto sa najprv klikne na jej skupinu; skupina s jednou sekciou sa otvorí už klepnutím na ňu.
 */
export async function navTo(page: Page, id: SectionId) {
  const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
  const link = nav.locator(`a[href="#${id}"]`);
  if (!(await link.isVisible())) {
    await nav.getByRole("button", { name: groupOf(id).label, exact: true }).click();
    // Druhý riadok sa vykreslí až po klepnutí. Ak je sekcia v skupine jediná viditeľná, otvorí sa už klepnutím na skupinu.
    const shown = await link.waitFor({ state: "visible", timeout: 1000 }).then(() => true, () => false);
    if (!shown) return;
  }
  await link.click();
}

/** Prepne na sekciu cez horný panel a overí, že sa zobrazila. */
export async function goTo(page: Page, id: SectionId) {
  await navTo(page, id);
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

/** Lokálny dátum YYYY-MM-DD posunutý o počet dní; aplikácia počíta s lokálnym dátumom, nie s UTC (A-12). */
export function localIsoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
