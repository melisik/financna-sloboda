import { describe, expect, it } from "vitest";
import { parseBackup } from "../src/storage/backup";
import { validateAppData } from "../src/storage/validate";

const TODAY = "2026-10-23";
const TS = "2026-10-01T10:00:00Z";

const goal = { id: "g1", name: "Dovolenka", targetCents: 500_000, createdAt: TS, updatedAt: TS };
const position = {
  id: "p1",
  name: "Fond",
  kind: "fond",
  quantity: 2,
  unitPrice: 100,
  currency: "EUR",
  fxToEur: 1,
  valueDate: "2026-10-01",
  goalId: "g1",
  createdAt: TS,
  updatedAt: TS,
};
const empty = {
  settings: null,
  transactions: [],
  snapshots: [],
  properties: [],
  assets: [],
  investments: [],
  liabilities: [],
  incomes: [],
  budgets: [],
  recurringExpenses: [],
  stockItems: [],
  recipes: [],
  dogs: [],
  goals: [], wasteRecords: [], shoppingItems: [],
};

describe("ciele investícií (D-105): validácia", () => {
  it("cieľ a položka, ktorá naň odkazuje, prejdú", () => {
    const r = validateAppData({ ...empty, goals: [goal], investments: [position] }, TODAY);
    expect(r.ok).toBe(true);
  });

  it("položka odkazuje na cieľ, ktorý v zálohe nie je: chyba", () => {
    const r = validateAppData({ ...empty, investments: [position] }, TODAY);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors).toContain("záloha: položka odkazuje na neznámy cieľ");
  });

  it("cieľ musí mať názov a celú kladnú sumu v centoch", () => {
    expect(validateAppData({ ...empty, goals: [{ ...goal, name: "  " }] }, TODAY).ok).toBe(false);
    expect(validateAppData({ ...empty, goals: [{ ...goal, targetCents: 0 }] }, TODAY).ok).toBe(false);
    expect(validateAppData({ ...empty, goals: [{ ...goal, targetCents: 12.5 }] }, TODAY).ok).toBe(false);
  });

  it("zoznam cieľov musí byť pole", () => {
    const { goals: _goals, ...withoutGoals } = empty;
    const r = validateAppData({ ...withoutGoals, goals: "zle" }, TODAY);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors).toContain("záloha: goals musí byť pole");
  });
});

describe("ciele investícií: záloha", () => {
  it("záloha verzie 11 bez poľa goals sa načíta s prázdnym zoznamom cieľov", () => {
    const { goals: _goals, ...withoutGoals } = empty;
    const parsed = parseBackup({ app: "financna-sloboda", schemaVersion: 11, exportedAt: "2026-10-20T10:00:00Z", ...withoutGoals }, TODAY);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data?.goals).toEqual([]);
  });

  it("záloha verzie 12 zachová ciele aj väzbu položky na cieľ", () => {
    const parsed = parseBackup(
      { app: "financna-sloboda", schemaVersion: 12, exportedAt: "2026-10-23T10:00:00Z", ...empty, goals: [goal], investments: [position] },
      TODAY,
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data?.goals).toEqual([goal]);
    expect(parsed.data?.investments[0].goalId).toBe("g1");
  });
});
