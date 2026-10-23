import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Testovacia záloha sa pri nasadení posunie o celé mesiace; dátumy po dnešku sa zrovnajú s dneškom (D-146). Syntetické dáta.
describe("testovacia záloha pri nasadení (D-146)", () => {
  it("najnovšia transakcia sa posunie do aktuálneho mesiaca a nepresiahne dnešok", () => {
    const file = join(mkdtempSync(join(tmpdir(), "zaloha-")), "zaloha.json");
    writeFileSync(file, JSON.stringify({ transactions: [{ date: "2026-08-10" }, { date: "2026-09-30" }] }));
    const out = execFileSync(process.execPath, [join(__dirname, "..", "scripts", "make-test-backup.mjs"), file], {
      env: { ...process.env, DEMO_TODAY: "2026-10-23" },
      encoding: "utf8",
    });
    const data = JSON.parse(readFileSync(file, "utf8"));
    expect(data.transactions.map((t: { date: string }) => t.date)).toEqual(["2026-09-10", "2026-10-23"]);
    expect(out).toContain("posunuté o 1 mes.");
  });
});
