import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { goTo, localIsoDay, openApp } from "./helpers";

/** Mesačná mriežka finančného kalendára (D-345): štruktúra, navigácia, povinnosti v bunkách, detail dňa, mobil. Syntetické údaje. */

const cal = (page: Page) => page.locator("section#financny-kalendar");
const day = (page: Page, date: string) => cal(page).locator(`button[data-date="${date}"]`);
const isWide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 700;

async function gotoMonth(page: Page, month: string) {
  await cal(page).getByLabel("Prejsť na mesiac").fill(month);
}

async function addOnDay(page: Page, date: string, name: string, amount = "20") {
  const s = cal(page);
  await day(page, date).click();
  await s.getByRole("button", { name: "+ Pridať povinnosť na tento deň" }).click();
  await expect(s.getByLabel("Dátum splatnosti")).toHaveValue(date);
  await s.getByLabel("Názov (napr. Poistenie auta)").fill(name);
  await s.getByLabel("Suma (€)").fill(amount);
  await s.locator("select").selectOption("iné");
  await s.getByRole("button", { name: "Uložiť", exact: true }).click();
  await expect(s.locator("li", { hasText: name })).toBeVisible();
}

async function addRecurring(page: Page, name: string, dayOfMonth: string, amount = "50") {
  await goTo(page, "pravidelne-vydavky");
  const s = page.locator("section#pravidelne-vydavky");
  await s.getByRole("button", { name: "Pridať pravidelný výdavok" }).click();
  await s.getByLabel("Názov (napr. predplatné)").fill(name);
  await s.getByLabel("Kategória pravidelného výdavku").selectOption("bývanie");
  await s.getByLabel("Suma mesačne (€)").fill(amount);
  await s.getByLabel("Od", { exact: true }).fill("2026-01-01");
  if (dayOfMonth) await s.getByLabel("Deň splatnosti v mesiaci (nepovinné)").fill(dayOfMonth);
  await s.getByRole("button", { name: "Uložiť výdavok" }).click();
  await expect(s.getByText(name)).toBeVisible();
}

test.describe("Mesačná mriežka kalendára (D-345)", () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page);
    await goTo(page, "financny-kalendar");
  });

  test("mriežka má 7 stĺpcov od pondelka, 4 až 6 týždňov a zvýraznený dnešok", async ({ page }) => {
    const s = cal(page);
    const heads = s.getByRole("columnheader");
    await expect(heads).toHaveCount(7);
    await expect(heads.first()).toHaveText("Po");
    await expect(heads.last()).toHaveText("Ne");
    const cells = await s.getByRole("gridcell").count();
    expect([28, 35, 42]).toContain(cells);
    await expect(s.locator('button[aria-current="date"]')).toHaveCount(1);
    await expect(s.locator('button[aria-current="date"]')).toHaveAttribute("data-date", localIsoDay(0));
  });

  test("navigácia: predchádzajúci, nasledujúci, Tento mesiac a výber mesiaca; funguje cez hranicu roka", async ({ page }) => {
    const s = cal(page);
    const label = s.locator("strong").filter({ hasText: /\d{4}/ }).first();
    await gotoMonth(page, "2026-12");
    await expect(label).toHaveText("December 2026");
    await s.getByRole("button", { name: "▶" }).click();
    await expect(label).toHaveText("Január 2027");
    await expect(s.getByLabel("Prejsť na mesiac")).toHaveValue("2027-01");
    await s.getByRole("button", { name: "◀" }).click();
    await expect(label).toHaveText("December 2026");
    await s.getByRole("button", { name: "Tento mesiac" }).click();
    await expect(s.getByLabel("Prejsť na mesiac")).toHaveValue(localIsoDay(0).slice(0, 7));
  });

  test("klik na deň ukáže jeho detail; prázdny deň ponúkne pridanie s predvyplneným dátumom", async ({ page }) => {
    const s = cal(page);
    await gotoMonth(page, "2027-03");
    await day(page, "2027-03-12").click();
    const detail = s.getByRole("region", { name: "Detail dňa" });
    await expect(detail.getByRole("heading", { name: "piatok 12. marca 2027" })).toBeVisible();
    await expect(detail.getByText("V tento deň nie je žiadna povinnosť.")).toBeVisible();
    await detail.getByRole("button", { name: "+ Pridať povinnosť na tento deň" }).click();
    await expect(s.getByLabel("Dátum splatnosti")).toHaveValue("2027-03-12");
  });

  test("pridaná povinnosť sa zobrazí na svojom dni s textovým stavom a v detaile s menom, sumou a stavom", async ({ page }) => {
    const s = cal(page);
    await gotoMonth(page, "2027-03");
    await addOnDay(page, "2027-03-12", "Poistenie testu", "42");
    const cell = day(page, "2027-03-12");
    await expect(cell).toHaveAttribute("aria-label", /1 povinnosť/);
    if (isWide(page)) {
      const chip = s.getByRole("button", { name: /Poistenie testu/ }).first();
      await expect(chip).toContainText("42");
      await expect(chip).toContainText("○");
    }
    const row = s.getByRole("region", { name: "Detail dňa" }).locator("li", { hasText: "Poistenie testu" });
    await expect(row).toContainText("čaká na úhradu");
    await expect(row).toContainText("12.");
    await expect(row.getByRole("button", { name: "Zaplatené" })).toBeVisible();
  });

  test("viac povinností v jednom dni: bunka ukáže počet a všetky sú v detaile", async ({ page }) => {
    const s = cal(page);
    await gotoMonth(page, "2027-03");
    for (const n of ["Prvá", "Druhá", "Tretia"]) await addOnDay(page, "2027-03-10", `${n} povinnosť`);
    await expect(day(page, "2027-03-10")).toHaveAttribute("aria-label", /3 povinnosti/);
    await expect(s.getByRole("region", { name: "Detail dňa" }).locator("li")).toHaveCount(3);
    if (isWide(page)) await expect(s.getByText("+1 ďalších")).toBeVisible();
  });

  test("povinnosť po splatnosti má značku „!“ a text, nielen farbu", async ({ page }) => {
    const s = cal(page);
    await gotoMonth(page, "2026-01");
    await addOnDay(page, "2026-01-05", "Oneskorená platba");
    await expect(day(page, "2026-01-05")).toHaveAttribute("aria-label", /po splatnosti/);
    const row = s.getByRole("region", { name: "Detail dňa" }).locator("li", { hasText: "Oneskorená platba" });
    await expect(row).toContainText("po splatnosti");
    await expect(row).toContainText("!");
  });

  test("klik na tlmený deň susedného mesiaca prepne mesiac", async ({ page }) => {
    const s = cal(page);
    await gotoMonth(page, "2027-03"); // 1. 4. 2027 je štvrtok, vidno 1. – 4. 4.
    await day(page, "2027-04-02").click();
    await expect(s.locator("strong").filter({ hasText: /\d{4}/ }).first()).toHaveText("Apríl 2027");
    await expect(s.getByRole("heading", { name: "piatok 2. apríla 2027" })).toBeVisible();
  });

  test("klávesnica: šípky presúvajú výber po dňoch a týždňoch", async ({ page }) => {
    await gotoMonth(page, "2027-03");
    await day(page, "2027-03-10").click();
    await day(page, "2027-03-10").focus();
    await page.keyboard.press("ArrowRight");
    await expect(day(page, "2027-03-11")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(day(page, "2027-03-18")).toBeFocused();
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("ArrowUp");
    await expect(day(page, "2027-03-10")).toBeFocused();
  });

  test("úzka obrazovka: bez vodorovného posunu, bunky majú značky stavu a detail je pod mriežkou", async ({ page }) => {
    const s = cal(page);
    await gotoMonth(page, "2027-03");
    await addOnDay(page, "2027-03-10", "Mobilná povinnosť");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    const gridBox = await s.getByRole("grid").boundingBox();
    const detailBox = await s.getByRole("region", { name: "Detail dňa" }).boundingBox();
    expect(detailBox!.y).toBeGreaterThan(gridBox!.y + gridBox!.height - 1);
    if (!isWide(page)) {
      await expect(s.getByRole("button", { name: /Mobilná povinnosť, / })).toHaveCount(0); // úzke rozloženie nevypisuje názvy v bunke
      await expect(day(page, "2027-03-10")).toHaveAttribute("aria-label", /1 povinnosť/);
    }
  });

  test("pravidelný výdavok s dňom 31 padne na posledný deň kratšieho mesiaca; uložený deň sa nemení", async ({ page }) => {
    await addRecurring(page, "Nájom test", "31");
    await expect(page.locator("section#pravidelne-vydavky")).toContainText("splatnosť 31. v mesiaci");
    await goTo(page, "financny-kalendar");
    const s = cal(page);
    await gotoMonth(page, "2027-02");
    await expect(day(page, "2027-02-28")).toHaveAttribute("aria-label", /1 povinnosť/);
    await gotoMonth(page, "2027-04");
    await expect(day(page, "2027-04-30")).toHaveAttribute("aria-label", /1 povinnosť/);
    await gotoMonth(page, "2027-01");
    await expect(day(page, "2027-01-31")).toHaveAttribute("aria-label", /1 povinnosť/);
    await goTo(page, "pravidelne-vydavky");
    await expect(page.locator("section#pravidelne-vydavky")).toContainText("splatnosť 31. v mesiaci");
    void s;
  });

  test("zaplatenie pravidelnej povinnosti upozorní, že sa do rozpočtu nezapočíta druhýkrát", async ({ page }) => {
    await addRecurring(page, "Nájom test", "15");
    await goTo(page, "financny-kalendar");
    const s = cal(page);
    await gotoMonth(page, "2027-03");
    await day(page, "2027-03-15").click();
    await s.getByRole("region", { name: "Detail dňa" }).getByRole("button", { name: "Zaplatené" }).click();
    const panel = s.getByRole("group", { name: "Potvrdenie vytvorenia transakcie" });
    await expect(panel).toContainText("nezapočíta druhýkrát");
    await expect(panel).toContainText("zníži kapitál");
    // bez potvrdenia nevznikne žiadna transakcia ani zaplatenie
    await panel.getByRole("button", { name: "Zrušiť", exact: true }).click();
    await expect(s.getByRole("region", { name: "Detail dňa" }).locator("li", { hasText: "Nájom test" })).toContainText("čaká na úhradu");
  });
});

/** V prehliadači: skutočný kontrast prvku z vypočítaných farieb vrátane priehľadnosti predkov (opacity sa premieta do farby textu aj pozadia). */
const MEASURE = (el: Element) => {
  const ctx = document.createElement("canvas").getContext("2d")!;
  const rgba = (c: string): [number, number, number, number] => {
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = c; ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255];
  };
  const over = (f: number[], b: number[], a: number) => [0, 1, 2].map((i) => f[i] * a + b[i] * (1 - a));
  // zložené pozadie smerom nahor od prvku `from` (vrátane) po prvé nepriehľadné; základ je biela
  const backdrop = (from: Element | null) => {
    const layers: [number, number, number, number][] = [];
    for (let e = from; e; e = e.parentElement) {
      const c = rgba(getComputedStyle(e).backgroundColor);
      if (c[3] > 0) layers.push(c);
      if (c[3] === 1) break;
    }
    let bg = [255, 255, 255]; for (const l of layers.reverse()) bg = over(l, bg, l[3]); return bg;
  };
  let bg = backdrop(el);
  let fg = (() => { const f = rgba(getComputedStyle(el).color); return over(f, bg, f[3]); })();
  let opacity = 1;
  for (let e: Element | null = el; e; e = e.parentElement) {
    const a = Number(getComputedStyle(e).opacity);
    if (a < 1) { // celý podstrom sa skladá s priehľadnosťou a nad pozadím rodiča
      const beneath = backdrop(e.parentElement);
      fg = over(fg, beneath, a); bg = over(bg, beneath, a); opacity *= a;
    }
  }
  const lum = (c: number[]) => { const t = c.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }); return 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]; };
  const a = lum(fg), b = lum(bg);
  return { ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05), opacity, fg: fg.map(Math.round).join(","), bg: bg.map(Math.round).join(",") };
};

// Povinnosti v tlmených bunkách susedného mesiaca musia byť čitateľné (WCAG 1.4.3: 4,5 : 1) vo svetlom aj tmavom režime.
// Pevný dnešok 4. 9. 2026: dni 1.–6. 9. sú v mriežke augusta 2026 „susedný mesiac“, 4. 9. je dnešok, 2. a 3. 9. sú po termíne, 5. 9. ešte čaká.
for (const scheme of ["light", "dark"] as const) {
  test.describe(`Kontrast v bunkách susedného mesiaca (${scheme}, D-345)`, () => {
    test.use({ colorScheme: scheme });

    test("názov, suma, „+N ďalších“, číslo dňa aj dnešok majú aspoň 4,5 : 1 (vrátane priehľadnosti predkov)", async ({ page }) => {
      test.skip(!isWide(page), "chipy s názvom a sumou sa zobrazujú od 700 px");
      test.setTimeout(120_000);
      await page.clock.setFixedTime(new Date("2026-09-04T10:00:00"));
      await openApp(page);
      await goTo(page, "financny-kalendar");
      const s = cal(page);
      await addOnDay(page, "2026-09-02", "Po termíne B", "40");
      await addOnDay(page, "2026-09-02", "Po termíne C", "50");
      await addOnDay(page, "2026-09-02", "Po termíne E", "60");
      await addOnDay(page, "2026-09-03", "Zaplatená A", "30");
      await addOnDay(page, "2026-09-05", "Čaká D", "70");
      await day(page, "2026-09-03").click();
      await s.getByRole("region", { name: "Detail dňa" }).locator("li", { hasText: "Zaplatená A" }).getByRole("button", { name: "Zaplatené" }).click();
      await s.getByRole("group", { name: "Potvrdenie vytvorenia transakcie" }).getByRole("button", { name: "Vytvoriť transakciu a označiť ako zaplatené" }).click();
      await expect(s.getByRole("region", { name: "Detail dňa" }).locator("li", { hasText: "Zaplatená A" }).getByText("prepojená s transakciou")).toBeVisible();

      await gotoMonth(page, "2026-08");
      await expect(s.getByRole("gridcell")).toHaveCount(42);
      await expect(s.locator("strong").filter({ hasText: /\d{4}/ }).first()).toHaveText("August 2026");

      const grid = s.getByRole("grid");
      const targets: [string, ReturnType<Page["locator"]>][] = [
        ["chip po splatnosti", grid.locator('button[title*="po splatnosti"]')],
        ["chip zaplatené", grid.locator('button[title*="zaplatené"]')],
        ["chip čaká", grid.locator('button[title*="čaká na úhradu"]')],
        ["+N ďalších", grid.getByText("+1 ďalších")],
        ["číslo dňa mimo mesiaca (bez povinnosti)", day(page, "2026-07-29")],
        ["číslo dňa mimo mesiaca (s povinnosťou)", day(page, "2026-09-03")],
        ["dnešok v susednom mesiaci", day(page, "2026-09-04")],
      ];
      const report: string[] = []; const bad: string[] = [];
      for (const [name, loc] of targets) {
        const n = await loc.count();
        if (n === 0) { bad.push(`${name}: nevykreslené`); continue; }
        for (let i = 0; i < n; i++) {
          const m = await loc.nth(i).evaluate(MEASURE);
          report.push(`${name}#${i}: ${m.ratio.toFixed(2)} : 1, priehľadnosť ${m.opacity}`);
          if (m.ratio < 4.5) bad.push(`${name}#${i}: kontrast ${m.ratio.toFixed(2)} : 1 (fg ${m.fg}, bg ${m.bg})`);
        }
      }
      test.info().annotations.push({ type: "kontrasty", description: report.join(" | ") });
      expect(bad, `${bad.join("\n")}\n--- namerané:\n${report.join("\n")}`).toEqual([]);

      // Susedný mesiac zostáva odlíšený: iné pozadie bunky a stlmené číslo dňa oproti dňu v mesiaci.
      const look = (date: string) => day(page, date).evaluate((b) => { const c = b.closest('[role="gridcell"]')!; return { cell: getComputedStyle(c).backgroundColor, num: getComputedStyle(b).color }; });
      const out = await look("2026-07-29"), inn = await look("2026-08-12");
      expect(out.cell, "pozadie bunky mimo mesiaca sa nelíši od bunky v mesiaci").not.toBe(inn.cell);
      expect(out.num, "číslo dňa mimo mesiaca nie je stlmené").not.toBe(inn.num);

      const axe = await new AxeBuilder({ page }).include('[role="grid"]').withRules(["color-contrast"]).analyze();
      expect(axe.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`)).toEqual([]);
    });
  });
}
