import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp, type SectionId } from "./helpers";

// Sieťová izolácia (A-15, FR-16, 07 §7): žiadna sekcia, skener, OCR ani import listu nepošle požiadavku mimo aplikácie.
const SECTIONS: SectionId[] = [
  "prehlad", "nova-transakcia", "prijmy", "rozpocet", "vyhodnotenie", "majetok", "zavazky", "investicie",
  "pravidelne-vydavky", "dane", "sklad", "rocny-prehlad", "nastavenia", "zaloha",
];

// Dáta v pamäti prehliadača (data:, blob:) sa neposielajú von; ostatné musia byť z vlastného pôvodu.
const isLocal = (url: string, origin: string): boolean =>
  url.startsWith("data:") || url.startsWith("blob:") || new URL(url).origin === origin;

test.describe("sieťová izolácia (A-15)", () => {
  test("žiadna sekcia, skener, fotka obalu ani import listu nepošle cudziu požiadavku", async ({ page }) => {
    test.setTimeout(300_000);
    const urls: string[] = [];
    page.on("request", (req) => urls.push(req.url()));

    await openApp(page);
    for (const id of SECTIONS) await goTo(page, id);

    // Skener kamerou sa spustí bez siete.
    await goTo(page, "sklad");
    await page.getByRole("button", { name: "Pridať položku skladu" }).click();
    await page.getByRole("button", { name: "Skenovať kódom kamerou" }).click();
    await expect(page.getByLabel("Kamera na čiarový kód")).toBeVisible();

    // Fotka obalu: OCR beží v prehliadači (slovenské dáta sú v public/tessdata).
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
    await page.locator('input[aria-label="Fotka obalu"]').setInputFiles({
      name: "obal-synteticky.png",
      mimeType: "image/png",
      buffer: Buffer.from(dataUrl.split(",")[1], "base64"),
    });
    await expect(page.getByText(/Navrhnuté:/)).toBeVisible({ timeout: 150_000 });

    // Import stránky listu vlastníctva.
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByRole("button", { name: "Predvyplniť z listu vlastníctva" }).click();
    await page.getByLabel("Nahrať uloženú stránku listu vlastníctva").setInputFiles(path.resolve("tests/fixtures/lv-synthetic.html"));
    await expect(page.getByLabel("Obec (pre daň z nehnuteľností, nepovinné)")).toHaveValue("Testovacia obec");

    expect(urls.length, "počúvanie požiadaviek nič nezachytilo").toBeGreaterThan(0);
    const local = new URL(page.url()).origin;
    const foreign = urls.filter((u) => !isLocal(u, local));
    expect(foreign, `Cudzie požiadavky: ${foreign.join(", ")}`).toEqual([]);
  });
});
