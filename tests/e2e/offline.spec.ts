import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

test.describe("PWA a offline režim (M5)", () => {
  test("service worker sa zaregistruje a aplikácia funguje offline po prvom načítaní", async ({ page, context }) => {
    const origin = new URL(page.url() || "http://localhost:4173").origin;
    const foreign: string[] = [];
    page.on("request", (req) => {
      const u = new URL(req.url());
      if (u.origin !== "http://localhost:4173") foreign.push(req.url());
    });

    await openApp(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); // po registrácii načítať cez SW
    await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await goTo(page, "vyhodnotenie");

    // Zadaj vyhodnotenie a transakciu online (dáta majú prežiť offline režim).
    await page.getByLabel("Hodnota investícií (€)").fill("100000");
    await page.getByLabel("Nasporená suma, hotovosť (€)").fill("20000");
    await page.getByRole("button", { name: "Uložiť vyhodnotenie" }).click();
    await expect(page.getByText("Posledné vyhodnotenie:").first()).toBeVisible();

    await goTo(page, "nova-transakcia");
    await page.getByLabel("Typ transakcie").selectOption("sporenie");
    await page.getByLabel("Suma (€)").fill("250");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 250 €")).toBeVisible();

    // Offline: načítanie aj dáta musia zostať.
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Finančná sloboda" })).toBeVisible();
    await goTo(page, "nova-transakcia");
    await expect(page.getByText("sporenie (do hotovosti) · 250 €")).toBeVisible();

    // Offline zápis: nová transakcia sa uloží a zobrazí.
    await page.getByLabel("Typ transakcie").selectOption("sporenie");
    await page.getByLabel("Suma (€)").fill("100");
    await page.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(page.getByText("sporenie (do hotovosti) · 100 €")).toBeVisible();

    // Sieťový test súkromia: žiadna požiadavka mimo vlastného pôvodu (07 §7).
    expect(foreign, `Cudzie požiadavky: ${foreign.join(", ")}`).toEqual([]);
    void origin;
  });
});
