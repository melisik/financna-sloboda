import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseBackup } from "../src/storage/backup";

// Testovacia záloha z Návodu (syntetické dáta) musí sa načítať v aktuálnej schéme.
const TODAY = new Date().toISOString().slice(0, 10); // záloha sa pri nasadení posúva na aktuálny mesiac

describe("testovacia záloha", () => {
  it("načíta sa v aktuálnej schéme a obsahuje dáta na ukážku", () => {
    const json = JSON.parse(readFileSync(path.resolve("public/testovacia-zaloha.json"), "utf8"));
    expect(json.schemaVersion).toBe(6);
    const parsed = parseBackup(json, TODAY);
    expect(parsed.ok, parsed.ok ? "" : parsed.errors.join("; ")).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.counts).toEqual({ transactions: 12, snapshots: 2 });
    expect(parsed.data?.transactions.some((t) => (t.receiptItems ?? []).length === 3)).toBe(true);
    expect(parsed.data?.transactions.some((t) => t.category === "jedlo")).toBe(true);
  });
});
