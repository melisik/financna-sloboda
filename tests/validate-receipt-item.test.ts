import { describe, expect, it } from "vitest";
import { validateTransaction } from "../src/storage/validate";

// validateReceiptItem nie je exportovaná; overuje sa cez validateTransaction (receiptItems).
// D-313, docs/57: zľava je záporná položka „zľava“; validácia zálohy pripúšťa zápornú cenu položky.
// Syntetické dáta.
const TODAY = "2026-10-25";
const item = (over: Record<string, unknown> = {}) => ({
  code: "1",
  name: "Chlieb",
  quantity: 1,
  vatPercent: 10,
  unitPriceCents: 150,
  amountCents: 150,
  ...over,
});
const tx = (receiptItems: unknown, over: Record<string, unknown> = {}) => ({
  id: "t1",
  date: "2026-10-20",
  type: "vydavok",
  amountCents: 100,
  source: "z_hotovosti",
  receiptItems,
  createdAt: "2026-10-20T10:00:00Z",
  updatedAt: "2026-10-20T10:00:00Z",
  ...over,
});
const errs = (items: unknown, over?: Record<string, unknown>) => validateTransaction(tx(items, over), TODAY);

describe("položka dokladu v zálohe (D-313)", () => {
  it("bežná položka a zľava ako záporná položka prejdú", () => {
    // 150 + (-50) = 100 = suma transakcie
    expect(errs([item(), item({ code: "2", name: "zľava", unitPriceCents: -50, amountCents: -50 })])).toEqual([]);
  });

  it("prázdny zoznam položiek prejde", () => {
    expect(errs([])).toEqual([]);
  });

  it("veľké sumy v centoch prejdú", () => {
    expect(errs([item({ unitPriceCents: 1_000_000_00, amountCents: 1_000_000_00 })])).toEqual([]);
  });

  it("nulová suma riadku je chyba, záporná nie", () => {
    expect(errs([item({ amountCents: 0 })]).join(" ")).toMatch(/položka 1: suma musí byť nenulové/);
    // Po revízii 25d (N-6): záporná suma len pri zľave so zápornou cenou a vedľa tovaru.
    expect(errs([item({}), item({ name: "zľava", unitPriceCents: -1, amountCents: -1 })])).toEqual([]);
  });

  it("necelé alebo nečíselné ceny sú chyba", () => {
    expect(errs([item({ unitPriceCents: 1.5 })]).join(" ")).toMatch(/jednotková cena/);
    expect(errs([item({ unitPriceCents: "150" })]).join(" ")).toMatch(/jednotková cena/);
    expect(errs([item({ amountCents: 1.5 })]).join(" ")).toMatch(/suma musí byť nenulové/);
    expect(errs([item({ amountCents: Number.NaN })]).join(" ")).toMatch(/suma musí byť nenulové/);
  });

  it("množstvo musí byť kladné", () => {
    for (const q of [0, -1, Number.NaN, "1"]) expect(errs([item({ quantity: q })]).join(" ")).toMatch(/počet musí byť kladné/);
    expect(errs([item({ quantity: 0.5 })])).toEqual([]);
  });

  it("DPH 0 prejde, záporná DPH nie", () => {
    expect(errs([item({ vatPercent: 0 })])).toEqual([]);
    expect(errs([item({ vatPercent: -1 })]).join(" ")).toMatch(/DPH/);
  });

  it("kód a názov sú povinné, názov max 200 znakov", () => {
    expect(errs([item({ code: "" })]).join(" ")).toMatch(/chýba kód/);
    expect(errs([item({ name: "   " })]).join(" ")).toMatch(/názov je povinný/);
    expect(errs([item({ name: "a".repeat(200) })])).toEqual([]);
    expect(errs([item({ name: "a".repeat(201) })]).join(" ")).toMatch(/max 200/);
  });

  it("neznáme pole a neobjekt sú chyba, chyba nesie číslo položky", () => {
    expect(errs([item(), item({ extra: 1 })]).join(" ")).toMatch(/položka 2: neznáme pole „extra“/);
    for (const bad of [null, [], "x", 5]) expect(errs([bad]).join(" ")).toMatch(/položka 1: musí byť objekt/);
  });

  it("položky patria len k výdavku a musia byť pole", () => {
    expect(errs([item()], { type: "prijem", source: undefined }).join(" ")).toMatch(/patria len k výdavku/);
    expect(errs({}).join(" ")).toMatch(/patria len k výdavku/);
  });

  it("transakcia s položkami ostáva kladná aj pri zľave (suma transakcie > 0)", () => {
    expect(errs([item()], { amountCents: -50 }).join(" ")).toMatch(/kladné celé číslo/);
  });
});

// Revízia 2026-10-25d, N-6: znamienko, kladný súčet, nekonečno.
describe("položky nákupu po revízii 25d", () => {
  const tx = (items: unknown[]) => ({ id: "t1", date: "2026-10-01", type: "vydavok", amountCents: 100, source: "z_prijmu", createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-01T00:00:00.000Z", receiptItems: items });
  const item = (o: Record<string, unknown>) => ({ code: "ručne", name: "x", quantity: 1, vatPercent: 0, unitPriceCents: 100, amountCents: 100, ...o });
  it("odmietne rozdielne znamienko ceny a sumy", () => {
    expect(validateTransaction(tx([item({ unitPriceCents: -50, amountCents: 50 })]), "2026-10-25").join()).toMatch(/rovnaké znamienko/);
  });
  it("odmietne samé zľavy (súčet nekladný)", () => {
    expect(validateTransaction(tx([item({ name: "zľava", unitPriceCents: -50, amountCents: -50 })]), "2026-10-25").join()).toMatch(/súčet položiek musí byť kladný/);
  });
  it("odmietne nekonečné množstvo a DPH", () => {
    expect(validateTransaction(tx([item({ quantity: Infinity })]), "2026-10-25").join()).toMatch(/počet/);
    expect(validateTransaction(tx([item({ vatPercent: Infinity })]), "2026-10-25").join()).toMatch(/DPH/);
  });
  it("prijme tovar so zľavou", () => {
    expect(validateTransaction(tx([item({}), item({ name: "zľava", unitPriceCents: -20, amountCents: -20 })]), "2026-10-25")).toEqual([]);
  });
});
