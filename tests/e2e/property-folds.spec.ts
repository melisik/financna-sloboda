import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Formulár nehnuteľnosti v troch úrovniach (D-310, docs/56). Syntetické hodnoty.
test("nová nehnuteľnosť: hlavné polia viditeľné, ostatné v zbalených blokoch so súhrnom; hypotéka sa sama rozbalí", async ({ page }) => {
  await openApp(page);
  await goTo(page, "majetok");
  const s = page.locator("section#majetok");
  await s.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
  await expect(s.getByLabel("Odhad hodnoty (€)")).toBeVisible();
  await expect(s.getByLabel("Zostatok hypotéky (€)")).toBeHidden();
  await expect(s.locator("summary", { hasText: "Hypotéka · bez hypotéky" })).toBeVisible();
  for (const t of ["Mesačné náklady", "Kúpa", "Údaje pre daň z nehnuteľností"]) await expect(s.locator("summary", { hasText: t })).toBeVisible();
  await s.locator("summary", { hasText: "Hypotéka" }).click();
  await s.getByLabel("Zostatok hypotéky (€)").fill("120000");
  await expect(s.locator("summary", { hasText: /Hypotéka · 120\s000,00\s€/ })).toBeVisible();
});
