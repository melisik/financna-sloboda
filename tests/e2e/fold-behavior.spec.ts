import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Zbalené bloky formulárov bez pomocníka openFormFolds (revízia 2026-10-25c, N-1 až N-3, N-9). Syntetické hodnoty.
test.describe("zbalené bloky formulárov", () => {
  test("záväzok: dátum zostatku je pri zostatku; nová chyba blok znova otvorí", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zavazky");
    const s = page.locator("section#zavazky");
    await s.getByRole("button", { name: "Pridať záväzok" }).click();
    await s.getByLabel("Zostatok dlhu (€)").fill("5000");
    await expect(s.getByLabel("Zostatok platí k (dátum)")).toBeVisible();

    const details = s.locator("details", { has: page.locator("summary", { hasText: "Podrobnosti" }) });
    await s.getByRole("button", { name: "Uložiť záväzok" }).click();
    await expect(s.getByText("Vyplň názov.")).toBeVisible();
    await expect(details).toHaveAttribute("open", "");
    await s.locator("summary", { hasText: "Podrobnosti" }).click();
    await expect(details).not.toHaveAttribute("open", "");
    await s.getByLabel("Názov", { exact: true }).fill("úver syntetický");
    await s.getByLabel("Splátka mesačne (€)").fill("-1");
    await s.getByRole("button", { name: "Uložiť záväzok" }).click();
    await expect(s.getByText("Splátka musí byť číslo 0 alebo viac.")).toBeVisible();
    await expect(details).toHaveAttribute("open", "");
  });

  test("nehnuteľnosť: splátka bez zostatku je v súhrne Hypotéky", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    const s = page.locator("section#majetok");
    await s.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await s.locator("summary", { hasText: "Hypotéka" }).click();
    await s.getByLabel("Mesačná splátka hypotéky (€)").fill("300");
    await expect(s.locator("summary", { hasText: /Hypotéka · bez zostatku · splátka 300,00\s€/ })).toBeVisible();
  });
});
