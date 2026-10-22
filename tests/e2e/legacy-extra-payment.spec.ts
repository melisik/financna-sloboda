import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { goTo, openApp } from "./helpers";

// Záznam mimoriadnej splátky z obdobia pred opravou (bez uložených hodnôt) sa dá zmazať z histórie; hodnoty ostanú. Syntetické hodnoty.
test.describe("mimoriadna splátka: starý záznam", () => {
  test("zmazanie záznamu bez uložených hodnôt nezmení zostatok ani splátku", async ({ page }) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const backup = JSON.parse(readFileSync(path.resolve("public/testovacia-zaloha.json"), "utf8"));
    backup.properties = [{
      id: "legacy-p", name: "Starý záznam", mode: "vlastne_byvanie", valueCents: 30_000_000, valueDate: today,
      mortgageBalanceCents: 80_000, balanceDate: today, mortgageRate: 0, monthlyPaymentCents: 50_000,
      extraPayments: [{ id: "legacy-e", date: today, amountCents: 20_000, mode: "znizit_splatku" }],
      createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T10:00:00Z",
    }];
    await openApp(page);
    await goTo(page, "zaloha");
    await page.getByLabel("Súbor zálohy").setInputFiles({ name: "stary-zaznam.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();

    await goTo(page, "majetok");
    const card = page.locator("#majetok div", { hasText: "Starý záznam" }).last();
    await expect(card).toContainText("Hypotéka: 800,00 €");
    await card.getByRole("button", { name: "Zmazať záznam z histórie" }).click();
    await card.getByRole("button", { name: "Potvrdiť zmazanie záznamu" }).click();
    await expect(card.getByText(/Mimoriadne splátky:/)).toHaveCount(0);
    await expect(card).toContainText("Hypotéka: 800,00 €");
    await expect(card).toContainText("Splátka hypotéky");
  });
});
