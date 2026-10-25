import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { goTo, openApp, TEST_NOW } from "./helpers";

// Prehľadnejšie usporiadanie obrazoviek (D-293, docs/46: priority 1 a 2). Testovacia záloha, syntetické dáta.
async function withBackup(page: Page) {
  await page.clock.setFixedTime(TEST_NOW); // revízia V-1: záloha má pevné dátumy (júl až október 2026)
  await openApp(page);
  await goTo(page, "zaloha");
  await page.getByLabel("Súbor zálohy").setInputFiles(path.resolve("public/testovacia-zaloha.json"));
  await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
  await expect(page.getByText("Dáta boli nahradené zálohou.")).toBeVisible();
}

test.describe("usporiadanie obrazoviek", () => {
  test("Nastavenia: skupiny Cieľ, Sporenie, Predpoklady výpočtu; Moduly, Sprievodca a PIN zbalené", async ({ page }) => {
    await openApp(page);
    await goTo(page, "nastavenia");
    const s = page.locator("section#nastavenia");
    const headings = await s.getByRole("heading", { level: 3 }).allInnerTexts();
    expect(headings.slice(0, 3)).toEqual(["Cieľ", "Sporenie", "Predpoklady výpočtu"]);
    const labels = await s.locator("input").evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent !== null).map((e) => e.closest("label")?.querySelector("span")?.textContent ?? ""));
    expect(labels.slice(0, 8)).toEqual([
      "Ročné výdavky pri nezávislosti (€)", "Miera výberu (%)",
      "Mesačné sporenie do investícií (€), prázdne = odvodené", "Mesačné sporenie do hotovosti (€), prázdne = odvodené",
      "Reálny výnos r (%)", "Poplatky p. a. (%)", "Rezerva, cieľová hodnota (€)", "Prah výdavkov (€)",
    ]);
    for (const name of ["Moduly", "Sprievodca", "PIN"]) await expect(s.locator("summary", { hasText: name })).toBeVisible();
    await expect(s.getByRole("button", { name: "Spustiť sprievodcu znova" })).toBeHidden();
    await s.locator("summary", { hasText: "Sprievodca" }).click();
    await expect(s.getByRole("button", { name: "Spustiť sprievodcu znova" })).toBeVisible();
  });

  test("Rozpočet: súhrn a kategórie ako text; limity až po Upraviť limity; nepoužité kategórie zbalené", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "rozpocet");
    const s = page.locator("section#rozpocet");
    await expect(s.getByText("Plán ešte nie je nastavený.")).toBeVisible();
    await expect(s.getByLabel("jedlo: limit (€)")).toBeHidden();
    await expect(s.locator("summary", { hasText: /Ďalšie kategórie \(\d+\)/ })).toBeVisible();
    await s.getByRole("button", { name: "Upraviť limity" }).click();
    await s.getByLabel("jedlo: limit (€)").fill("50");
    await s.getByRole("button", { name: "Uložiť rozpočet" }).click();
    await expect(s.getByLabel("jedlo: limit (€)")).toBeHidden();
    await expect(s).toContainText(/Minuté .* z plánu 50,00\s€/);
    await expect(s.getByText(/jedlo/).first()).toBeVisible();
  });

  test("Rozpočet: Zrušiť zahodí rozpísané limity (revízia S-6)", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "rozpocet");
    const s = page.locator("section#rozpocet");
    await s.getByRole("button", { name: "Upraviť limity" }).click();
    await s.getByLabel("jedlo: limit (€)").fill("50");
    await s.getByRole("button", { name: "Uložiť rozpočet" }).click();
    await s.getByRole("button", { name: "Upraviť limity" }).click();
    await s.getByLabel("jedlo: limit (€)").fill("999");
    await s.getByLabel("zábava: limit (€)").fill("20");
    await s.getByRole("button", { name: "Zrušiť" }).click();
    await s.getByRole("button", { name: "Upraviť limity" }).click();
    await expect(s.getByLabel("jedlo: limit (€)")).toHaveValue("50");
    await expect(s.getByLabel("zábava: limit (€)")).toHaveValue("");
  });

  test("Pravidelné výdavky: pri položke len Upraviť; Ukončiť a Zmazať sú v úprave", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "pravidelne-vydavky");
    const s = page.locator("section#pravidelne-vydavky");
    const card = s.locator("div", { hasText: "Streaming" }).filter({ has: page.getByRole("button", { name: "Upraviť" }) }).last();
    await expect(card.getByRole("button")).toHaveCount(1);
    await card.getByRole("button", { name: "Upraviť" }).click();
    const form = s.locator("div", { has: page.getByRole("heading", { name: "Upraviť pravidelný výdavok" }) }).last();
    await expect(form.getByRole("button", { name: "Ukončiť od zajtra" })).toBeVisible();
    await form.getByRole("button", { name: "Zmazať", exact: true }).click();
    await form.getByRole("button", { name: "Zmazať", exact: true }).click();
    await expect(s.getByText("Streaming")).toHaveCount(0);
  });

  test("Transakcie: filter zbalený; 10 posledných záznamov a Zobraziť staršie", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");
    await expect(s.getByLabel("Filter typu")).toBeHidden();
    const rows = s.locator("li", { has: page.getByRole("button", { name: "Upraviť" }) });
    await expect(rows).toHaveCount(10);
    await s.getByRole("button", { name: "Zobraziť staršie" }).click();
    await expect(rows).toHaveCount(20);
    await s.getByRole("button", { name: "Zobraziť staršie" }).click();
    await expect(rows).toHaveCount(23);
    await expect(s.getByRole("button", { name: "Zobraziť staršie" })).toHaveCount(0);
    await s.locator("summary", { hasText: "Filter" }).click();
    await s.getByLabel("Filter typu").selectOption("sporenie");
    await expect(rows).toHaveCount(4);
  });

  test("Ročný prehľad: súhrn po rokoch prvý; bez údajov minulého roka bez porovnania; vyhodnotenia zbalené", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "rocny-prehlad");
    const s = page.locator("section#rocny-prehlad");
    const h3 = await s.getByRole("heading", { level: 3 }).allInnerTexts();
    expect(h3.slice(0, 2)).toEqual(["Súhrn po rokoch", "Výdavky podľa kategórií"]);
    await expect(s).toContainText("Minulý rok nemá zapísané výdavky, porovnanie sa ukáže neskôr.");
    await expect(s).not.toContainText("minulý rok 0,00");
    await expect(s.locator("summary", { hasText: "Vyhodnotenia (2)" })).toBeVisible();
    await expect(s.getByText("Zmena K:")).toBeHidden();
  });

  test("Dane: bez investícií s režimom jedna veta namiesto kariet s nulami", async ({ page }) => {
    await openApp(page);
    await goTo(page, "dane");
    const s = page.locator("section#dane");
    await expect(s).toContainText("Daňový režim zatiaľ nemá žiadna investícia.");
    await expect(s.getByText("Hodnota investícií v režime")).toHaveCount(0);
  });

  test("Záloha: dve časti s nadpismi; správa o exporte je v časti Uložiť zálohu (docs/46, 3.7)", async ({ page }) => {
    await openApp(page);
    await goTo(page, "zaloha");
    const s = page.locator("section#zaloha");
    await expect(s.locator("h3")).toHaveText(["Záloha do súboru", "Obnoviť zo zálohy"]);
    const save = s.locator("h3", { hasText: "Záloha do súboru" });
    const restore = s.locator("h3", { hasText: "Obnoviť zo zálohy" });
    const y = async (l: import("@playwright/test").Locator) => (await l.boundingBox())!.y;
    expect(await y(save)).toBeLessThan(await y(s.getByRole("button", { name: "Uložiť zálohu" })));
    expect(await y(s.getByRole("button", { name: "Uložiť zálohu" }))).toBeLessThan(await y(restore));
    expect(await y(restore)).toBeLessThan(await y(s.getByRole("button", { name: "Vybrať súbor zálohy" })));
    await s.getByLabel("Heslo na šifrovanie zálohy").fill("kratke");
    await s.getByRole("button", { name: "Uložiť zálohu" }).click();
    const msg = s.getByText(/Heslo musí mať aspoň 8 znakov/);
    await expect(msg).toBeVisible();
    expect(await y(msg)).toBeLessThan(await y(restore));
  });

  test("Transakcie: súčet uvádza počet; zbalený filter sa dá zbaliť aj pri zapnutom filtri (revízia N-6, N-7)", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");
    await expect(s.getByText(/Súčet všetkých transakcií \(23\):/)).toBeVisible();
    await s.locator("summary", { hasText: "Filter" }).click();
    await s.getByLabel("Filter typu").selectOption("sporenie");
    await expect(s.getByText(/Súčet transakcií vo filtri \(4\):/)).toBeVisible();
    const details = s.locator("details", { has: page.locator("summary", { hasText: "Filter · zapnutý" }) });
    await s.locator("summary", { hasText: "Filter · zapnutý" }).click();
    await expect(details).not.toHaveAttribute("open", "");
    await s.locator("summary", { hasText: "Filter · zapnutý" }).click();
    await expect(details).toHaveAttribute("open", "");
  });

  test("Pravidelné výdavky: Ukončiť nejde pri neuložených zmenách (revízia N-9)", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "pravidelne-vydavky");
    const s = page.locator("section#pravidelne-vydavky");
    await s.locator("div", { hasText: "Streaming" }).last().getByRole("button", { name: "Upraviť" }).click();
    await expect(s.getByRole("button", { name: "Ukončiť od zajtra" })).toBeEnabled();
    await s.getByLabel("Suma mesačne (€)").fill("15");
    await expect(s.getByRole("button", { name: "Ukončiť od zajtra" })).toBeDisabled();
    await expect(s.getByText("Ukončiť sa dá po uložení alebo zrušení zmien.")).toBeVisible();
  });

  test("Testovacia záloha: Energie sú v kategórii dom a energie (revízia N-4)", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "rozpocet");
    await expect(page.locator("section#rozpocet p", { hasText: /^dom a energie: minuté 95,00\s€/ })).toBeVisible();
  });

  test("Transakcie: výdavok zhodný s pravidelným výdavkom sa uloží až po potvrdení (D-299, docs/53)", async ({ page }) => {
    await withBackup(page);
    await goTo(page, "pravidelne-vydavky");
    await expect(page.locator("section#pravidelne-vydavky")).toContainText("Nezapisuj ich aj ako transakciu.");
    await goTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");
    await expect(s.getByText(/Súčet všetkých transakcií \(23\):/)).toBeVisible();
    await s.getByLabel("Suma (€)").fill("650");
    await s.getByLabel("Kategória").selectOption("bývanie");
    await s.getByRole("button", { name: "Uložiť transakciu" }).click();
    await expect(s.getByText("Toto vyzerá ako pravidelný výdavok „Nájom“, ktorý sa už ráta automaticky každý mesiac.")).toBeVisible();
    await expect(s.getByText(/Súčet všetkých transakcií \(23\):/)).toBeVisible();
    await s.getByRole("button", { name: "Neukladať" }).click();
    await expect(s.getByText(/ktorý sa už ráta automaticky/)).toHaveCount(0);
    await expect(s.getByText(/Súčet všetkých transakcií \(23\):/)).toBeVisible();
    await s.getByLabel("Suma (€)").fill("650");
    await s.getByLabel("Kategória").selectOption("bývanie");
    await s.getByRole("button", { name: "Uložiť transakciu" }).click();
    await s.getByRole("button", { name: "Uložiť aj tak" }).click();
    await expect(s.getByText(/Súčet všetkých transakcií \(24\):/)).toBeVisible();
  });
});

