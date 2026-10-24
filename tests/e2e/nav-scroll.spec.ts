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

// Výška menu na telefóne (docs/40, variant C): skupiny celé, sekcie v jednom riadku, ktorý sa posúva do strany.
test("menu v skupine Peniaze má pri 390 px najviac 180 px a stránka sa neposúva do strany", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  await page.evaluate(() => { window.location.hash = "nova-transakcia"; });
  await expect(page.locator("section#nova-transakcia")).toBeVisible();
  const m = await page.evaluate(() => ({
    sticky: document.querySelector('nav[aria-label="Hlavná navigácia"]')!.parentElement!.getBoundingClientRect().height,
    over: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
  expect(m.sticky).toBeLessThanOrEqual(180);
  expect(m.over).toBeLessThanOrEqual(0);
});

test("aktívna sekcia na konci riadku je po otvorení viditeľná", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openApp(page);
  // Bez kliknutia: Playwright by pri kliknutí posunul riadok sám.
  await page.evaluate(() => { window.location.hash = "pravidelne-vydavky"; });
  await expect(page.locator("section#pravidelne-vydavky")).toBeVisible();
  await page.waitForTimeout(150);
  const m = await page.evaluate(() => {
    const active = document.querySelector('nav[aria-label="Hlavná navigácia"] a[aria-current="page"]')!;
    const a = active.getBoundingClientRect();
    const row = active.parentElement!.getBoundingClientRect();
    return { left: a.left, right: a.right, rowLeft: row.left, rowRight: row.right };
  });
  expect(m.left).toBeGreaterThanOrEqual(m.rowLeft - 1);
  expect(m.right).toBeLessThanOrEqual(m.rowRight + 1);
});

test("na širokej obrazovke sú všetky sekcie skupiny viditeľné bez posúvania riadku", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openApp(page);
  await page.evaluate(() => { window.location.hash = "nova-transakcia"; });
  await expect(page.locator("section#nova-transakcia")).toBeVisible();
  const m = await page.evaluate(() => {
    const row = document.querySelector('nav[aria-label="Hlavná navigácia"] a[aria-current="page"]')!.parentElement!;
    return { scroll: row.scrollWidth, client: row.clientWidth };
  });
  expect(m.scroll).toBeLessThanOrEqual(m.client);
});
