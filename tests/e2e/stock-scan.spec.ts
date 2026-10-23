import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Skener obalu: rozpoznanie textu z fotky offline (tesseract v appke). Syntetický obal s textom.
test.describe("skener skladu", () => {
  test("z fotky obalu navrhne názov a dátum spotreby (offline OCR)", async ({ page }) => {
    test.setTimeout(180_000);
    await openApp(page);
    await goTo(page, "sklad");
    await page.getByRole("button", { name: "Pridať položku skladu" }).click();

    const dataUrl = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 900;
      c.height = 320;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#000";
      ctx.font = "bold 64px sans-serif";
      ctx.fillText("MLIEKO", 40, 110);
      ctx.fillText("Spotrebujte do 15.03.2027", 40, 230);
      return c.toDataURL("image/png");
    });
    const buffer = Buffer.from(dataUrl.split(",")[1], "base64");

    await page.locator('input[aria-label="Fotka obalu"]').setInputFiles({ name: "obal.png", mimeType: "image/png", buffer });
    await expect(page.getByText(/Navrhnuté:/)).toBeVisible({ timeout: 150_000 });
    await expect(page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)")).toHaveValue("2027-03-15");
    await expect(page.getByText(/Navrhnutý názov z fotky: MLIEKO/i)).toBeVisible();
    await page.getByRole("button", { name: "Použiť názov" }).click();
    await expect(page.getByLabel("Názov (napr. mlieko)")).toHaveValue(/MLIEKO/i);
  });

  test("slabé svetlo: nízky kontrast a dátum len s mesiacom sa rozpoznajú", async ({ page }) => {
    test.setTimeout(180_000);
    await openApp(page);
    await goTo(page, "sklad");
    await page.getByRole("button", { name: "Pridať položku skladu" }).click();

    const dataUrl = await page.evaluate(() => {
      const c = document.createElement("canvas");
      c.width = 900;
      c.height = 320;
      const ctx = c.getContext("2d")!;
      ctx.fillStyle = "#9a9a9a";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#5c5c5c";
      ctx.font = "bold 60px sans-serif";
      ctx.fillText("CINI MINIS", 40, 120);
      ctx.fillText("Spotrebujte do 10.2027", 40, 240);
      return c.toDataURL("image/png");
    });
    const buffer = Buffer.from(dataUrl.split(",")[1], "base64");

    await page.locator('input[aria-label="Fotka obalu"]').setInputFiles({ name: "obal.png", mimeType: "image/png", buffer });
    await expect(page.getByText(/Navrhnuté:/)).toBeVisible({ timeout: 150_000 });
    await expect(page.getByLabel("Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)")).toHaveValue("2027-10-31");
    await expect(page.getByText("Rozpoznaný text z fotky")).toBeVisible();
  });
});
