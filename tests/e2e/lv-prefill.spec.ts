import { expect, test } from "@playwright/test";
import { goTo, openApp, openPropertyFolds } from "./helpers";

// Predvyplnenie z listu vlastníctva (D-209). Syntetický text, žiadne reálne údaje.
const LV = `LIST VLASTNÍCTVA (syntetický vzor)
Okres: Testovací okres
Obec: Testovacia obec
Katastrálne územie: Testovo
A. Parcely
Parc. č. 123/4 zastavaná plocha a nádvorie, výmera 250 m2
B. Stavby
Súpisné číslo 55, rodinný dom na parcele 123/4
C. Vlastníci
Vlastník: Vzorový Vlastník, bytom Testovacia 1
`;

test.describe("predvyplnenie z listu vlastníctva", () => {
  test("text z LV doplní údaje pre daň, text sa vymaže a nehnuteľnosť sa uloží", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await openPropertyFolds(page); // D-310: bloky formulára sú zbalené
    await page.getByRole("button", { name: "Predvyplniť z listu vlastníctva" }).click();
    await page.getByLabel("Text z listu vlastníctva").fill(LV);
    await page.getByRole("button", { name: "Predvyplniť z textu" }).click();

    await expect(page.getByLabel("Obec (pre daň z nehnuteľností, nepovinné)")).toHaveValue("Testovacia obec");
    await expect(page.getByLabel("Katastrálne územie (nepovinné)")).toHaveValue("Testovo");
    await expect(page.getByLabel("Číslo parcely (nepovinné)")).toHaveValue("123/4");
    await expect(page.getByLabel("Súpisné číslo (nepovinné)")).toHaveValue("55");
    await expect(page.getByLabel("Text z listu vlastníctva")).toHaveValue("");
    await expect(page.getByText(/^Doplnené: /)).toBeVisible();

    await page.getByLabel("Režim").selectOption("prenajom");
    await page.getByLabel("Odhad hodnoty (€)").fill("300000");
    await page.getByLabel("Dátum odhadu").fill("2026-10-01");
    await page.getByRole("button", { name: "Uložiť nehnuteľnosť" }).click();
    await expect(page.locator("section#majetok")).toContainText("parcela 123/4");
  });

  test("záložné právo v LV len upozorní a hypotéku nevytvorí (D-216)", async ({ page }) => {
    await openApp(page);
    await goTo(page, "majetok");
    await page.getByRole("button", { name: "Pridať nehnuteľnosť" }).click();
    await openPropertyFolds(page); // D-310: bloky formulára sú zbalené
    await page.getByRole("button", { name: "Predvyplniť z listu vlastníctva" }).click();
    await page.getByLabel("Text z listu vlastníctva").fill("Obec: Iná obec\nByt č. 12\nZáložné právo v prospech banky\n");
    await page.getByRole("button", { name: "Predvyplniť z textu" }).click();
    await expect(page.getByLabel("Číslo bytu (nepovinné)")).toHaveValue("12");
    await expect(page.getByText("V liste je záložné právo.")).toBeVisible();
    await expect(page.getByLabel("Zostatok hypotéky (€)")).toHaveValue("0");
  });
});
