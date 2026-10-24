import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Týždenný súhrn mailom (N-10, D-277): odkaz mailto s predmetom a textom, bez príjemcu. Syntetické hodnoty.
test("Prehľad ponúka odkaz na mail s týždenným súhrnom", async ({ page }) => {
  await openApp(page);
  await goTo(page, "prehlad");
  const link = page.getByRole("link", { name: "Poslať mailom" });
  await expect(link).toBeVisible();
  const href = await link.getAttribute("href");
  expect(href).toMatch(/^mailto:\?subject=/);
  expect(decodeURIComponent(href!)).toContain("Týždenný súhrn výdavkov");
  expect(decodeURIComponent(href!)).toContain("Počet zápisov: 0");
});
