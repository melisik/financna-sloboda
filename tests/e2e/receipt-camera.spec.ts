import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Živé skenovanie QR kódu z kamery (D-126). Falošná kamera prehrá syntetické video s QR kódom.
test.use({
  launchOptions: {
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      `--use-file-for-fake-video-capture=${path.join(process.cwd(), "tests", "e2e", "fixtures", "receipt-camera.y4m")}`,
    ],
  },
});

test.describe("živé skenovanie kamerou", () => {
  test("kamera rozpozná QR kód a priradí doklad bez zobrazenia čísla", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await page.getByRole("button", { name: "Skenovať QR kód kamerou" }).click();
    await expect(page.getByLabel("Živý náhľad kamery")).toBeVisible();

    await expect(page.getByText("Doklad je priradený.")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("body")).not.toContainText("O-A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6");
    await expect(page.getByLabel("Živý náhľad kamery")).toHaveCount(0);
  });

  test("zrušenie zatvorí náhľad kamery", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nova-transakcia");
    await page.getByRole("button", { name: "Skenovať QR kód kamerou" }).click();
    await page.getByRole("button", { name: "Zrušiť" }).click();
    await expect(page.getByLabel("Živý náhľad kamery")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Skenovať QR kód kamerou" })).toBeVisible();
  });
});
