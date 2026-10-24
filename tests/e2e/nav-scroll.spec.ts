import { expect, test } from "@playwright/test";
import { openApp } from "./helpers";

// Ťuknutie na už aktívnu sekciu v menu nesmie skryť jej nadpis pod prilepeným menu (docs/39). Syntetické hodnoty.
test("aktívna sekcia v menu nechá nadpis viditeľný pod menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
  await nav.getByRole("button", { name: "Peniaze", exact: true }).click();
  await expect(page.locator("section#nova-transakcia")).toBeVisible();
  await nav.locator('a[href="#nova-transakcia"]').click();
  await page.waitForTimeout(200);
  const m = await page.evaluate(() => {
    const navBox = document.querySelector('nav[aria-label="Hlavná navigácia"]')!.parentElement!.getBoundingClientRect();
    const h2 = document.querySelector("section#nova-transakcia h2")!.getBoundingClientRect();
    return { navBottom: navBox.bottom, h2Top: h2.top };
  });
  expect(m.h2Top).toBeGreaterThanOrEqual(m.navBottom);
});
