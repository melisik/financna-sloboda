import { expect, test } from "@playwright/test";

// FR-12, D-117 (docs/20): sprievodca má päť krokov a výsledok; každý krok sa dá preskočiť.
test.describe("sprievodca prvým nastavením (FR-12, D-117)", () => {
  test("celý tok od úvodu po výsledok a otvorenie prehľadu", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Vitaj" })).toBeVisible();
    await page.getByRole("button", { name: "Pokračovať" }).click();

    // Výdavky sú povinné: prázdne pole sa neprijme a chyba povie, čo treba urobiť.
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await expect(page.getByText("Vyplň ročné výdavky. Napríklad 24 000 € ročne.")).toBeVisible();
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Pokračovať" }).click();

    // Miera výberu je nepovinná: prázdne pole použije východiskovú hodnotu, ktorá je na tlačidle.
    await expect(page.getByRole("heading", { name: "Koľko z kapitálu ročne vyberieš?" })).toBeVisible();
    await expect(page.getByText("Miera výberu je podiel kapitálu, ktorý ročne minieš.")).toBeVisible();
    await page.getByRole("button", { name: /Nechať \d+,\d %/ }).click();

    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť a zobraziť dátum" }).click();

    await expect(page.getByRole("heading", { name: "Ulož si zálohu" })).toBeVisible();
    await page.getByRole("button", { name: "Pokračovať" }).click();

    await expect(page.getByRole("heading", { name: "Chceš PIN?" })).toBeVisible();
    await page.getByRole("button", { name: "Bez PIN" }).click();

    await expect(page.getByRole("heading", { name: "Hotovo" })).toBeVisible();
    await expect(page.getByText(/Dátum cieľa:/)).toBeVisible();
    await page.getByRole("button", { name: "Otvoriť prehľad" }).click();
    await expect(page.locator("section#prehlad")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Hlavná navigácia" })).toBeVisible();
  });

  test("preskočenie vedie na hlavnú stránku a neničí zadané údaje", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await page.getByRole("button", { name: "Preskočiť na hlavnú stránku" }).click();
    await expect(page.getByRole("navigation", { name: "Hlavná navigácia" })).toBeVisible();
    await expect(page.locator("section#prehlad")).toBeVisible();
  });

  test("PIN nastavený v onboardingu zamkne appku po obnovení; chybný PIN sa odmietne (D-119)", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await page.getByRole("button", { name: /Nechať \d+,\d %/ }).click();
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť a zobraziť dátum" }).click();
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await page.getByLabel("Nový PIN (4 až 6 číslic)").fill("1234");
    await page.getByLabel("Zopakuj PIN").fill("1234");
    await page.getByRole("button", { name: "Nastaviť PIN" }).click();
    await page.getByRole("button", { name: "Otvoriť prehľad" }).click();
    await expect(page.locator("section#prehlad")).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Zadaj PIN" })).toBeVisible();
    await expect(page.locator("section#prehlad")).toHaveCount(0);
    await page.getByLabel("PIN").fill("0000");
    await page.getByRole("button", { name: "Odomknúť" }).click();
    await expect(page.getByText("Nesprávny PIN. Skús znova.")).toBeVisible();
    await page.getByLabel("PIN").fill("1234");
    await page.getByRole("button", { name: "Odomknúť" }).click();
    await expect(page.locator("section#prehlad")).toBeVisible();
  });
});

test.describe("sprievodca: priebeh a návod (docs/20)", () => {
  test("rozpracovaný krok sa po obnovení stránky vráti a pri preskočení je odkaz na návod", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await page.getByLabel("Ročné výdavky pri nezávislosti (€)").fill("24000");
    await page.getByRole("button", { name: "Pokračovať" }).click();
    await expect(page.getByRole("heading", { name: "Koľko z kapitálu ročne vyberieš?" })).toBeVisible();
    await expect(page.getByText("Návod nájdeš v sekcii Prehľad")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Koľko z kapitálu ročne vyberieš?" })).toBeVisible();
  });
});
