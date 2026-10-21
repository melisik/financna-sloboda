import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Doklad z QR kódu (D-126, D-133). Syntetické číslo; nesmie sa zobraziť na stránke.
const RECEIPT = "O-A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6";

test.describe("QR kód dokladu", () => {
  test("z fotky QR kódu sa doklad priradí bez zobrazenia čísla", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Fotka QR kódu dokladu").setInputFiles(path.join(process.cwd(), "tests", "e2e", "fixtures", "receipt-qr.png"));

    await expect(page.getByText("Doklad je priradený.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(RECEIPT);
    await expect(page.getByRole("link", { name: "Overiť doklad na portáli" })).toHaveAttribute("href", "https://opd.financnasprava.sk/#!/check");
  });

  test("overenie skopíruje číslo do schránky a číslo sa neukáže", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Fotka QR kódu dokladu").setInputFiles(path.join(process.cwd(), "tests", "e2e", "fixtures", "receipt-qr.png"));
    await expect(page.getByText("Doklad je priradený.")).toBeVisible();

    await page.getByRole("link", { name: "Overiť doklad na portáli" }).click({ noWaitAfter: true });
    await expect(page.getByText("Číslo je v schránke. Vložte ho na portál.")).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(RECEIPT);
    await expect(page.locator("body")).not.toContainText(RECEIPT);
  });

  test("doklad sa dá odstrániť", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Fotka QR kódu dokladu").setInputFiles(path.join(process.cwd(), "tests", "e2e", "fixtures", "receipt-qr.png"));
    await expect(page.getByText("Doklad je priradený.")).toBeVisible();
    await page.getByRole("button", { name: "Odstrániť doklad" }).click();
    await expect(page.getByText("Doklad je priradený.")).toHaveCount(0);
  });
});

test.describe("QR kód na veľkej fotke", () => {
  test("malý QR kód na fotke z telefónu sa prečíta", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await page.getByLabel("Fotka QR kódu dokladu").setInputFiles(path.join(process.cwd(), "tests", "e2e", "fixtures", "receipt-qr-large.png"));

    await expect(page.getByText("Doklad je priradený.")).toBeVisible();
    await expect(page.locator("body")).not.toContainText(RECEIPT);
  });
});
