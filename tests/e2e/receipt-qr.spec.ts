import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Číslo dokladu z fotky QR kódu (D-126). QR kód obsahuje syntetické číslo dokladu.
test.describe("QR kód dokladu", () => {
  test("z fotky QR kódu sa načíta číslo dokladu a ukáže sa overovací odkaz", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Fotka QR kódu dokladu").setInputFiles(path.join(process.cwd(), "tests", "e2e", "fixtures", "receipt-qr.png"));

    await expect(page.getByLabel("Číslo dokladu (nepovinné, z QR kódu)")).toHaveValue("O-A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6");
    await expect(page.getByRole("link", { name: /Overiť doklad/ })).toHaveAttribute("href", "https://opd.financnasprava.sk/#!/check");
  });
});

test.describe("QR kód na veľkej fotke", () => {
  test("malý QR kód na fotke z telefónu sa prečíta", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Fotka QR kódu dokladu").setInputFiles(path.join(process.cwd(), "tests", "e2e", "fixtures", "receipt-qr-large.png"));

    await expect(page.getByLabel("Číslo dokladu (nepovinné, z QR kódu)")).toHaveValue("O-A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6");
  });
});
