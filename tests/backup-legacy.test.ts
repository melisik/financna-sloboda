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

  // nález T9 (docs/30): chýbajúce pole budgets sa pre verziu 2 nedoplní prázdnym zoznamom (doplní sa len pre verziu 1,
  // src/storage/backup.ts:44). Záloha vytvorená pred 2026-10-19 sa tak nedá obnoviť. Nízka závažnosť: aplikácia je pred vydaním.
  it("nález T9: verzia 2 bez poľa budgets sa načíta s prázdnym rozpočtom (vzor FR-28 a D-124)", () => {
    const parsed = parseBackup(v2, "2026-10-19");
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data?.budgets).toEqual([]);
  });
});
