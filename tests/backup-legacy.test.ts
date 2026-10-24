import { describe, expect, it } from "vitest";
import { parseBackup } from "../src/storage/backup";

// Záloha verzie 2 (FR-28): obsahuje majetok, ale ešte nie rozpočty (zavedené v commite 85864ea, 2026-10-19, bez zvýšenia verzie schémy).
const v2 = {
  app: "financna-sloboda",
  schemaVersion: 2,
  exportedAt: "2026-10-18T10:00:00Z",
  settings: null,
  transactions: [],
  snapshots: [],
  properties: [],
  assets: [],
  investments: [],
  liabilities: [],
  incomes: [],
};

describe("import zálohy verzie 2 (FR-28, READABLE_SCHEMA_VERSIONS)", () => {
  it("verzia 2 s prázdnym rozpočtom sa načíta", () => {
    const parsed = parseBackup({ ...v2, budgets: [] }, "2026-10-19");
    expect(parsed.ok).toBe(true);
  });
});
