/**
 * DIAGNOSTICKÝ AUDIT M 0.1 – vizuálne screenshoty všetkých 16 sekcií.
 * Dočasný súbor, nemeňte existujúce testy. Spustenie: len tento súbor.
 */
import path from "node:path";
import { test, type Page } from "@playwright/test";

const OUT = path.resolve("test-results/audit-m01");
const BACKUP = path.resolve("public/testovacia-zaloha.json");
const TEST_NOW = new Date("2026-10-25T10:00:00");

type SectionId = "prehlad" | "nova-transakcia" | "scenar-vydavku" | "mesacny-vydavok" | "prijmy" |
  "rozpocet" | "vyhodnotenie" | "majetok" | "zavazky" | "investicie" |
  "pravidelne-vydavky" | "dane" | "sklad" | "rocny-prehlad" | "nastavenia" | "zaloha";

const NAV_GROUPS: { label: string; sections: SectionId[] }[] = [
  { label: "Prehľad",          sections: ["prehlad"] },
  { label: "Peniaze",          sections: ["nova-transakcia", "scenar-vydavku", "mesacny-vydavok", "prijmy", "rozpocet", "pravidelne-vydavky"] },
  { label: "Majetok a zásoby", sections: ["majetok", "sklad", "zavazky", "investicie", "dane"] },
  { label: "Plán a výsledky",  sections: ["vyhodnotenie", "rocny-prehlad"] },
  { label: "Nastavenia a záloha", sections: ["nastavenia", "zaloha"] },
];

function groupOf(id: SectionId) {
  return NAV_GROUPS.find(g => g.sections.includes(id))!;
}

async function openApp(page: Page) {
  await page.goto("/");
  const skip = page.getByRole("button", { name: "Preskočiť na hlavnú stránku" });
  await skip.waitFor({ state: "visible", timeout: 8000 }).catch(() => undefined);
  if (await skip.isVisible().catch(() => false)) await skip.click();
}

async function loadBackup(page: Page) {
  await page.clock.setFixedTime(TEST_NOW);
  await openApp(page);
  const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
  const grpBtn = nav.getByRole("button", { name: "Nastavenia a záloha", exact: true });
  if (await grpBtn.isVisible().catch(() => false)) await grpBtn.click();
  const link = nav.locator('a[href="#zaloha"]');
  await link.waitFor({ state: "visible", timeout: 3000 }).catch(() => undefined);
  if (await link.isVisible().catch(() => false)) await link.click();
  await page.locator("section#zaloha").waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
  const fileInput = page.getByLabel("Súbor zálohy");
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(BACKUP);
    await page.getByRole("button", { name: "Nahradiť dáta zálohou" }).click();
    await page.waitForTimeout(600);
  }
}

async function navTo(page: Page, id: SectionId) {
  const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
  const link = nav.locator(`a[href="#${id}"]`);
  if (!(await link.isVisible().catch(() => false))) {
    const grp = groupOf(id);
    await nav.getByRole("button", { name: grp.label, exact: true }).click();
    await link.waitFor({ state: "visible", timeout: 2000 }).catch(() => undefined);
  }
  if (await link.isVisible().catch(() => false)) await link.click();
  await page.locator(`section#${id}`).waitFor({ state: "visible", timeout: 5000 }).catch(() => undefined);
}

async function shot(page: Page, name: string) {
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
}

test.describe("390x844 – 16 sekcií", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("všetky sekcie", async ({ page }) => {
    await loadBackup(page);
    const sections: SectionId[] = [
      "prehlad", "nova-transakcia", "scenar-vydavku", "mesacny-vydavok",
      "prijmy", "rozpocet", "vyhodnotenie", "majetok",
      "zavazky", "investicie", "pravidelne-vydavky", "dane",
      "sklad", "rocny-prehlad", "nastavenia", "zaloha"
    ];
    for (const id of sections) {
      await navTo(page, id);
      await shot(page, `390_${id}`);
    }
  });
});

test.describe("320x700 – 4 kritické sekcie", () => {
  test.use({ viewport: { width: 320, height: 700 }, hasTouch: true, isMobile: true });

  test("kritické sekcie", async ({ page }) => {
    await loadBackup(page);
    for (const id of ["prehlad", "nova-transakcia", "majetok", "rocny-prehlad"] as SectionId[]) {
      await navTo(page, id);
      await shot(page, `320_${id}`);
    }
  });
});

test.describe("Formulárový tok – transakcie", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("suma, poznámka, Uložiť viditeľnosť, desatinné oddeľovače", async ({ page }) => {
    await loadBackup(page);
    await navTo(page, "nova-transakcia");
    const s = page.locator("section#nova-transakcia");

    await shot(page, "form_1_empty");

    const amountField = s.getByLabel("Suma (€)");
    await amountField.tap();
    await page.waitForTimeout(500);
    await shot(page, "form_2_amount_tapped");

    await amountField.fill("85");
    await page.waitForTimeout(300);
    await shot(page, "form_3_amount_85");

    // Viditeľnosť tlačidla Uložiť
    const saveBtn = s.getByRole("button", { name: "Uložiť transakciu" });
    const bbox = await saveBtn.boundingBox();
    const vp = page.viewportSize()!;
    const saveVisible = bbox !== null && bbox.y >= 0 && bbox.y + bbox.height <= vp.height;
    console.log(`SAVE_VISIBLE=${saveVisible} y=${bbox?.y} bottom=${bbox ? bbox.y + bbox.height : 'n/a'} vp_h=${vp.height}`);

    // Zadaj poznámku
    const noteField = s.getByLabel("Poznámka (voliteľná)");
    await noteField.tap();
    await page.waitForTimeout(500);
    await shot(page, "form_4_note_tapped");
    await noteField.fill("Testovacia poznámka");
    await page.waitForTimeout(200);
    await shot(page, "form_5_note_filled");

    await shot(page, "form_6_complete_form");

    // Test desatinných oddeľovačov
    await amountField.fill("12.50");
    await page.waitForTimeout(100);
    const valDot = await amountField.inputValue();
    console.log(`DECIMAL_DOT: input='12.50' => value='${valDot}'`);
    // Čiarka: Playwright nemôže zadať čiarku do input[type=number] – to je samo o sebe nálezom (B: funkčne potvrdené)
    // Simulujeme cez dispatchEvent namiesto fill()
    await amountField.evaluate((el: HTMLInputElement) => {
      el.value = "12,50";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await page.waitForTimeout(100);
    const valComma = await amountField.inputValue();
    console.log(`DECIMAL_COMMA: forced='12,50' => element.value='${valComma}'`);
    await shot(page, "form_7_decimal");
  });
});
