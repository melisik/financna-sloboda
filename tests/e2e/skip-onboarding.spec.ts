import { expect, test } from "@playwright/test";
import { goTo } from "./helpers";

// Preskočenie onboardingu nerozbije appku: predvolené hodnoty a odkazy na chýbajúce kroky.
test("po preskočení sprievodcu appka funguje a ukáže, čo ešte chýba", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Preskočiť na hlavnú stránku" }).click();
  await expect(page.locator("section#prehlad")).toBeVisible();
  await expect(page.getByText("Cieľová suma: nezadaná")).toBeVisible();

  await goTo(page, "nova-transakcia");
  await expect(page.getByText("Najprv urob vyhodnotenie")).toBeVisible();
  await page.locator("section#nova-transakcia").getByRole("link", { name: "Vyhodnotenie" }).click();
  await expect(page.locator("section#vyhodnotenie")).toBeVisible();

  await goTo(page, "vyhodnotenie");
  await page.getByLabel("Hodnota investícií (€)").fill("100000");
  await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
  await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();

  await goTo(page, "nastavenia");
  await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
  await page.getByRole("button", { name: "Uložiť nastavenia" }).click();

  await goTo(page, "prehlad");
  // Po vyhodnotení je cieľová suma v riadku Pokrok (D-283).
  await expect(page.getByText(/Pokrok: \d+\s% \(.+ z \D*648/)).toBeVisible();
});
