import path from "node:path";
import { expect, test } from "@playwright/test";
import { goTo, openApp } from "./helpers";

// Predvyplnenie z uloženej HTML stránky listu vlastníctva (D-211). Syntetický súbor z tests/fixtures.
test.describe("predvyplnenie z uloženej HTML stránky listu", () => {
  test("nahratý HTML súbor doplní údaje z buniek tabuliek, aj viac parciel a súpisné číslo", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByText("Predvyplniť z listu vlastníctva").click();
    await page.getByLabel("Nahrať uloženú stránku listu vlastníctva").setInputFiles(path.resolve("tests/fixtures/lv-synthetic.html"));

    await expect(page.getByLabel("Obec (pre daň z nehnuteľností, nepovinné)")).toHaveValue("Testovacia obec");
    await expect(page.getByLabel("Katastrálne územie (nepovinné)")).toHaveValue("Testovo");
    await expect(page.getByLabel("Číslo parcely (nepovinné)")).toHaveValue("111/6, 111/33");
    await expect(page.getByLabel("Súpisné číslo (nepovinné)")).toHaveValue("77");
    await expect(page.getByLabel("Číslo bytu (nepovinné)")).toHaveValue("12");
    await expect(page.getByLabel("Druh objektu pre daň")).toHaveValue("byt");
    await expect(page.getByText("V liste je záložné právo v prospech ostatných vlastníkov bytov. Nie je to hypotéka.")).toBeVisible();
  });

  test("vložený HTML zdrojový kód sa spracuje rovnako ako nahratý súbor", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await page.getByText("Predvyplniť z listu vlastníctva").click();
    const html = (await import("node:fs")).readFileSync(path.resolve("tests/fixtures/lv-synthetic.html"), "utf-8");
    await page.getByLabel("Text z listu vlastníctva").fill(html);
    await page.getByRole("button", { name: "Predvyplniť z textu" }).click();
    await expect(page.getByLabel("Súpisné číslo (nepovinné)")).toHaveValue("77");
    await expect(page.getByLabel("Číslo parcely (nepovinné)")).toHaveValue("111/6, 111/33");
  });
});
