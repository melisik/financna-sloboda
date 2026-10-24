import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { goTo, openApp, type SectionId } from "./helpers";

// Dostupnosť (M6, WCAG 2.1 AA): automatická kontrola každej sekcie a reflow pri 320 px (zoom 400 %).
const SECTIONS: SectionId[] = [
  "prehlad", "nova-transakcia", "scenar-vydavku", "mesacny-vydavok", "vyhodnotenie", "majetok", "zavazky", "investicie", "prijmy", "rozpocet",
  "pravidelne-vydavky", "dane", "sklad", "rocny-prehlad", "nastavenia", "zaloha",
];

test.describe("dostupnosť", () => {
  for (const id of SECTIONS) {
    test(`sekcia ${id}: bez vážnych a kritických porušení WCAG 2.1 AA`, async ({ page }) => {
      await openApp(page);
      await goTo(page, id);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const summary = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.help}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });

    test(`sekcia ${id}: bez vodorovného posúvania pri 320 px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 });
      await openApp(page);
      await goTo(page, id);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `presah o ${overflow} px`).toBeLessThanOrEqual(0);
    });
  }
});

// Tmavý režim (systémová voľba): rovnaká kontrola dostupnosti, najmä kontrast textu a ohraničení.
test.describe("dostupnosť v tmavom režime", () => {
  test.use({ colorScheme: "dark" });
  for (const id of SECTIONS) {
    test(`sekcia ${id}: tmavý režim bez vážnych a kritických porušení`, async ({ page }) => {
      await openApp(page);
      await goTo(page, id);
      const isDark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor !== "rgb(255, 255, 255)");
      expect(isDark).toBe(true);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      const summary = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.help}`);
      expect(summary, summary.join("\n")).toEqual([]);
    });
  }
});
