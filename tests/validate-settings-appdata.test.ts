import { describe, expect, it } from "vitest";
import { validateAppData, validateSettings } from "../src/storage/validate";

const TODAY = "2026-10-23";

const settings = {
  expensesCents: 2_400_000, // V = 24 000 €
  withdrawalRate: 0.04, // p = 4 %
  realReturn: 0.035, // r (D-050)
  reserveCents: 0,
  thresholdCents: 10_000,
};

describe("validateSettings: hranice vstupov nastavení (FR-01, FR-02, D-064)", () => {
  it("základné nastavenia sú platné", () => {
    expect(validateSettings(settings, TODAY)).toEqual([]);
  });

  it("miera výberu je v (0, 1]: 0 a 1,5 sú chyba, 1 je platná", () => {
    expect(validateSettings({ ...settings, withdrawalRate: 0 }, TODAY)).toEqual(["nastavenia: miera výberu musí byť v (0, 1]"]);
    expect(validateSettings({ ...settings, withdrawalRate: 1.5 }, TODAY)).toEqual(["nastavenia: miera výberu musí byť v (0, 1]"]);
    expect(validateSettings({ ...settings, withdrawalRate: 1 }, TODAY)).toEqual([]);
  });

  it("výnos r je v [0, 1]", () => {
    expect(validateSettings({ ...settings, realReturn: -0.01 }, TODAY)).toEqual(["nastavenia: výnos r musí byť v [0, 1]"]);
    expect(validateSettings({ ...settings, realReturn: 0 }, TODAY)).toEqual([]);
    expect(validateSettings({ ...settings, realReturn: 1 }, TODAY)).toEqual([]);
  });

  it("výdavky musia byť kladné celé centy", () => {
    const msg = ["nastavenia: výdavky musia byť kladné celé číslo v centoch"];
    expect(validateSettings({ ...settings, expensesCents: 0 }, TODAY)).toEqual(msg);
    expect(validateSettings({ ...settings, expensesCents: 2.5 }, TODAY)).toEqual(msg);
  });

  it("prah a rezerva sú povinné celé čísla ≥ 0", () => {
    const { thresholdCents: _t, ...withoutThreshold } = settings;
    expect(validateSettings(withoutThreshold, TODAY)).toEqual(["nastavenia: thresholdCents musí byť celé číslo ≥ 0"]);
  });

  it("ručné sporenie: záporná hodnota je chyba, chýbajúci kľúč nie je", () => {
    expect(validateSettings({ ...settings, savingInvCents: -1 }, TODAY)).toEqual([
      "nastavenia: savingInvCents musí byť celé číslo ≥ 0 alebo prázdne",
    ]);
    expect(validateSettings(settings, TODAY)).toEqual([]);
  });

  it("poplatky sú v [0, 1) alebo chýbajú (D-064)", () => {
    const msg = ["nastavenia: poplatky musia byť v [0, 1) alebo chýbať (D-064)"];
    expect(validateSettings({ ...settings, feesRate: 1 }, TODAY)).toEqual(msg);
    expect(validateSettings({ ...settings, feesRate: 0.005 }, TODAY)).toEqual([]);
  });

  it("dátum poslednej kontroly D_L nesmie byť v budúcnosti", () => {
    expect(validateSettings({ ...settings, lastReviewDate: "2026-10-24" }, TODAY)).toEqual(["nastavenia: D_L: dátum nesmie byť v budúcnosti"]);
    expect(validateSettings({ ...settings, lastReviewDate: "2026-10-23" }, TODAY)).toEqual([]);
  });

  it("neznáme pole je chyba a nie-objekt je chyba", () => {
    expect(validateSettings({ ...settings, foo: 1 }, TODAY)).toEqual(["nastavenia: neznáme pole „foo“"]);
    expect(validateSettings("x", TODAY)).toEqual(["nastavenia: musia byť objekt"]);
  });
});

describe("validateAppData: celá záloha (FR-18)", () => {
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
    goals: [], wasteRecords: [],
  };

  const tx = (id: string, amountCents: number) => ({
    id,
    date: "2026-10-05",
    type: "sporenie",
    amountCents,
    createdAt: "2026-10-05T10:00:00Z",
    updatedAt: "2026-10-05T10:00:00Z",
  });

  it("prázdne zbierky sú platné a vrátia dáta", () => {
    const r = validateAppData(empty, TODAY);
    expect(r.ok).toBe(true);
    expect(r.data?.transactions).toEqual([]);
    expect(r.data?.settings).toBeNull();
  });

  it("obsah, ktorý nie je objekt, je chyba", () => {
    expect(validateAppData(null, TODAY)).toEqual({ ok: false, errors: ["záloha musí byť objekt"] });
  });

  it("chýbajúca zbierka zablokuje celý import", () => {
    const { transactions: _t, ...withoutTransactions } = empty;
    const r = validateAppData(withoutTransactions, TODAY);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors).toContain("záloha: transactions musí byť pole");
  });

  it("duplicitné id v transakciách je chyba", () => {
    const r = validateAppData({ ...empty, transactions: [tx("t1", 10_000), tx("t1", 20_000)] }, TODAY);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors).toContain("záloha: duplicitné id v transakcie");
  });

  it("chyba v položke sa hlási s jej číslom", () => {
    const r = validateAppData({ ...empty, transactions: [tx("t1", 0)] }, TODAY);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors).toContain("transakcia 1: suma musí byť kladné celé číslo v centoch");
  });

  it("neznáme pole na najvyššej úrovni je chyba", () => {
    const r = validateAppData({ ...empty, foo: 1 }, TODAY);
    expect(r.ok).toBe(false);
    expect(r.ok === false && r.errors).toContain("záloha: neznáme pole „foo“");
  });
});
