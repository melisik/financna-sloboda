import { describe, expect, it } from "vitest";
import { activeDogCount, isDogActive } from "../src/domain/dogs";
import { validateDog } from "../src/storage/validate";
import type { Dog } from "../src/storage/types";

// Evidencia psov (D-159). Syntetické hodnoty.
const TODAY = "2026-10-22";
const base: Dog = { id: "d1", municipality: "Testovacia obec", address: "Hlavná 1", keepingPlace: "byt", purpose: "domaci", startDate: "2025-03-01", createdAt: "x", updatedAt: "x" };

describe("evidencia psov (D-159)", () => {
  it("pes je evidovaný od vzniku do zániku vrátane", () => {
    expect(isDogActive(base, TODAY)).toBe(true);
    expect(isDogActive({ ...base, endDate: "2026-10-21" }, TODAY)).toBe(false);
    expect(isDogActive({ ...base, endDate: TODAY }, TODAY)).toBe(true);
    expect(isDogActive({ ...base, startDate: "2026-11-01" }, TODAY)).toBe(false);
  });

  it("počet psov dnes počíta len aktívnych", () => {
    expect(activeDogCount([base, { ...base, id: "d2", endDate: "2026-01-01" }, { ...base, id: "d3", startDate: "2027-01-01" }], TODAY)).toBe(1);
  });

  it("validácia odmietne psa bez obce, zlé miesto držania a zánik pred vznikom", () => {
    expect(validateDog(base, TODAY)).toEqual([]);
    expect(validateDog({ ...base, municipality: " " }, TODAY).join(" ")).toMatch(/obec je povinná/);
    expect(validateDog({ ...base, keepingPlace: "kopec" }, TODAY).join(" ")).toMatch(/miesto držania/);
    expect(validateDog({ ...base, endDate: "2025-01-01" }, TODAY).join(" ")).toMatch(/zánik nesmie byť pred vznikom/);
  });
});

import { buildBackup, parseBackup } from "../src/storage/backup";
import type { AppData } from "../src/storage/types";

describe("psy v zálohe (D-159)", () => {
  const data: AppData = {
    settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [],
    incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [], dogs: [base],
  };

  it("export a import zachová psy", () => {
    const json = JSON.parse(JSON.stringify(buildBackup(data, "2026-10-22T10:00:00Z")));
    const parsed = parseBackup(json, TODAY);
    expect(parsed.ok && parsed.data?.dogs).toEqual([base]);
  });

  it("staršia záloha bez psov sa načíta s prázdnym zoznamom", () => {
    const v6: any = parseBackup({ app: "financna-sloboda", schemaVersion: 6, exportedAt: "2026-10-01T00:00:00Z", settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [] }, TODAY);
    expect(v6.ok).toBe(true);
    expect(v6.data.dogs).toEqual([]);
  });
});
