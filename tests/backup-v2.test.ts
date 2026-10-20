import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildBackup, parseBackup } from "../src/storage/backup";
import type { AppData, Asset, Property } from "../src/storage/types";

// FR-28: schéma v2 pridáva majetok; záloha v1 sa načíta bez straty dát.
const TODAY = "2026-10-19";
const property: Property = {
  id: "p1",
  name: "byt – syntetický",
  mode: "prenajom",
  valueCents: 30_000_000,
  valueDate: "2026-10-01",
  mortgageBalanceCents: 15_000_000,
  monthlyRentCents: 90_000,
  createdAt: "2026-10-19T10:00:00Z",
  updatedAt: "2026-10-19T10:00:00Z",
};

describe("záloha verzie 2 a import verzie 1 (FR-28)", () => {
  it("záloha verzie 1 (testovacia, syntetická) sa načíta a majetok je prázdny", () => {
    const json = JSON.parse(readFileSync(path.resolve("public/testovacia-zaloha.json"), "utf8"));
    expect(json.schemaVersion).toBe(1);
    const parsed = parseBackup(json, TODAY);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data?.properties).toEqual([]);
    expect(parsed.data?.assets).toEqual([]);
    expect(parsed.data?.investments).toEqual([]);
    expect(parsed.data?.liabilities).toEqual([]);
    expect(parsed.data?.incomes).toEqual([]);
    expect(parsed.data?.budgets).toEqual([]);
    expect(parsed.data?.transactions.length).toBe(3);
    expect(parsed.data?.snapshots.length).toBe(1);
  });

  it("export a import verzie 2 zachová nehnuteľnosť", () => {
    const asset: Asset = { id: "a1", kind: "automobil", name: "auto – syntetické", valueCents: 1_200_000, valueDate: "2026-10-01", createdAt: "2026-10-19T10:00:00Z", updatedAt: "2026-10-19T10:00:00Z" };
    const data: AppData = { settings: null, transactions: [], snapshots: [], properties: [property], assets: [asset], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [] };
    const backup = JSON.parse(JSON.stringify(buildBackup(data, "2026-10-19T10:00:00Z")));
    expect(backup.schemaVersion).toBe(6); // v6 pridáva položky dokladu (D-129); v5 recepty (D-127); v4 sklad; v3 pravidelné výdavky (D-124)
    const parsed = parseBackup(backup, TODAY);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data?.properties).toEqual([property]);
    expect(parsed.data?.assets).toEqual([asset]);
  });

  it("verzia 2 bez poľa properties je odmietnutá", () => {
    const parsed = parseBackup({ app: "financna-sloboda", schemaVersion: 2, exportedAt: "x", settings: null, transactions: [], snapshots: [] }, TODAY);
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.errors.join(" ")).toMatch(/properties musí byť pole/);
  });

  it("nehnuteľnosť s neplatným režimom zablokuje celý import", () => {
    const bad = { app: "financna-sloboda", schemaVersion: 2, exportedAt: "x", settings: null, transactions: [], snapshots: [], properties: [{ ...property, mode: "chata" }] };
    const parsed = parseBackup(bad, TODAY);
    expect(parsed.ok).toBe(false);
  });
});
