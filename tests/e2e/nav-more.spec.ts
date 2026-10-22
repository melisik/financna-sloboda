import { expect, test } from "@playwright/test";
import { navTo, openApp } from "./helpers";

// Horný panel je v piatich skupinách; ponuka Viac sa nepoužíva (D-170, D-205). Syntetické hodnoty.
const SECTIONS = ["prehlad", "nova-transakcia", "prijmy", "rozpocet", "vyhodnotenie", "majetok", "zavazky", "investicie", "pravidelne-vydavky", "dane", "sklad", "rocny-prehlad", "nastavenia", "zaloha"] as const;

test.describe("horný panel: skupiny a všetky sekcie dosiahnuteľné", () => {
  test("žiadne tlačidlo Viac, päť skupín a každá sekcia sa dá otvoriť z panela", async ({ page }) => {
    await openApp(page);
    const nav = page.getByRole("navigation", { name: "Hlavná navigácia" });
    await expect(nav.getByRole("button", { name: /^Viac/ })).toHaveCount(0);
    await expect(nav.getByRole("button")).toHaveCount(5);
    for (const id of SECTIONS) {
      await navTo(page, id);
      await expect(page.locator(`section#${id}`)).toBeVisible();
    }
  });
});
