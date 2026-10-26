import { describe, expect, it } from "vitest";
import * as fc from "fast-check";
import { applyGoalShares, goalSummaries, groupByGoal, normalizePosition, positionShares, positionValueCents } from "../src/domain/investments";
import type { InvestmentGoal, Position } from "../src/storage/types";
import { buildBackup, parseBackup } from "../src/storage/backup";
import { validatePosition } from "../src/storage/validate";

// D-334 (docs/65): jedna investícia na viac cieľov v percentách; plnenie cieľa sa vždy počíta správne:
// nikdy sa nepočíta dvakrát (súčet podielov najviac 100 %) a súčet cieľov a „bez cieľa“ je celá hodnota investícií.
const NOW = "2026-10-26T10:00:00Z";
const pos = (id: string, value: number, extra: Partial<Position> = {}): Position => ({ id, name: id, kind: "etf", quantity: 1, unitPrice: value, currency: "EUR", fxToEur: 1, valueDate: "2026-10-01", createdAt: NOW, updatedAt: NOW, ...extra });
const goal = (id: string, target: number): InvestmentGoal => ({ id, name: id, targetCents: target * 100, createdAt: NOW, updatedAt: NOW });

describe("podiely položky v cieľoch (D-334)", () => {
  it("staré goalId sa číta ako podiel 100 %; goalShares má prednosť", () => {
    expect(positionShares(pos("a", 1, { goalId: "g1" }))).toEqual([{ goalId: "g1", percent: 100 }]);
    expect(positionShares(pos("a", 1))).toEqual([]);
    expect(positionShares(pos("a", 1, { goalId: "g1", goalShares: [{ goalId: "g2", percent: 40 }] }))).toEqual([{ goalId: "g2", percent: 40 }]);
  });
  it("normalizePosition prevedie goalId na goalShares a goalId zruší", () => {
    const n = normalizePosition(pos("a", 1, { goalId: "g1" }));
    expect(n.goalShares).toEqual([{ goalId: "g1", percent: 100 }]);
    expect("goalId" in n).toBe(false);
    expect(normalizePosition(pos("b", 1))).toEqual(pos("b", 1));
  });
  it("položka 20 000 € rozdelená 70 % a 30 % na dva ciele", () => {
    const groups = groupByGoal([pos("etf", 20_000, { goalShares: [{ goalId: "g1", percent: 70 }, { goalId: "g2", percent: 30 }] })], [goal("g1", 30_000), goal("g2", 10_000)]);
    expect(groups.map((g) => g.totalCents)).toEqual([1_400_000, 600_000]);
    expect(groups.some((g) => g.goal === null)).toBe(false);
    expect(goalSummaries([pos("etf", 20_000, { goalShares: [{ goalId: "g1", percent: 70 }, { goalId: "g2", percent: 30 }] })], [goal("g1", 30_000), goal("g2", 10_000)]).map((s) => [s.percent, s.reached])).toEqual([[46, false], [60, false]]);
  });
  it("nepriradený zvyšok ide do „bez cieľa“ a podiel na zmazaný cieľ tiež", () => {
    const groups = groupByGoal([pos("a", 1_000, { goalShares: [{ goalId: "g1", percent: 60 }, { goalId: "zmazany", percent: 10 }] })], [goal("g1", 1_000)]);
    expect(groups[0].totalCents).toBe(60_000);
    expect(groups[1].goal).toBeNull();
    expect(groups[1].totalCents).toBe(40_000);
  });
  it("viac položiek v jednom cieli sa sčíta podľa podielov", () => {
    const groups = groupByGoal([pos("a", 1_000, { goalShares: [{ goalId: "g1", percent: 50 }] }), pos("b", 400, { goalShares: [{ goalId: "g1", percent: 100 }] })], [goal("g1", 2_000)]);
    expect(groups[0].totalCents).toBe(90_000);
  });
  it("INVARIANT: súčet cieľov a „bez cieľa“ je vždy celá hodnota investícií; cieľ nikdy nedostane viac než hodnotu položiek", () => {
    const share = fc.record({ goalId: fc.constantFrom("g1", "g2", "g3"), percent: fc.integer({ min: 1, max: 100 }) });
    const position = fc.record({ value: fc.integer({ min: 0, max: 5_000_000 }), shares: fc.array(share, { maxLength: 3 }) });
    fc.assert(fc.property(fc.array(position, { maxLength: 8 }), (items) => {
      const positions = items.map((it, i) => {
        const seen = new Set<string>(); let sum = 0; const shares: { goalId: string; percent: number }[] = [];
        for (const s of it.shares) { if (seen.has(s.goalId) || sum + s.percent > 100) continue; seen.add(s.goalId); sum += s.percent; shares.push(s); }
        return pos(`p${i}`, it.value / 100, { goalShares: shares });
      });
      const total = positions.reduce((s, p) => s + positionValueCents(p), 0);
      const groups = groupByGoal(positions, [goal("g1", 1), goal("g2", 1), goal("g3", 1)]);
      expect(groups.reduce((s, g) => s + g.totalCents, 0)).toBe(total);
    }), { numRuns: 200 });
  });
});

describe("applyGoalShares (D-334)", () => {
  it("nastaví podiel cieľa pri položkách a odstráni ho pri nulových; ostatné ciele nechá", () => {
    const positions = [pos("a", 100, { goalShares: [{ goalId: "g2", percent: 30 }] }), pos("b", 100, { goalShares: [{ goalId: "g1", percent: 50 }] }), pos("c", 100)];
    const r = applyGoalShares(positions, "g1", { a: 40, b: 0, c: 0 }, NOW);
    expect(r.error).toBeUndefined();
    expect(r.changed.map((p) => [p.id, p.goalShares])).toEqual([["a", [{ goalId: "g2", percent: 30 }, { goalId: "g1", percent: 40 }]], ["b", undefined]]);
    expect(r.changed.every((p) => p.updatedAt === NOW && !("goalId" in p))).toBe(true);
  });
  it("odmietne súčet podielov položky nad 100 % a pomenuje položku", () => {
    const r = applyGoalShares([pos("a", 100, { name: "ETF", goalShares: [{ goalId: "g2", percent: 70 }] })], "g1", { a: 40 }, NOW);
    expect(r.error).toMatch(/ETF.*100/);
    expect(r.changed).toEqual([]);
  });
  it("odmietne necelé alebo záporné percento a nad 100", () => {
    expect(applyGoalShares([pos("a", 1)], "g1", { a: 12.5 }, NOW).error).toBeTruthy();
    expect(applyGoalShares([pos("a", 1)], "g1", { a: -1 }, NOW).error).toBeTruthy();
    expect(applyGoalShares([pos("a", 1)], "g1", { a: 101 }, NOW).error).toBeTruthy();
  });
  it("bez zmeny nič nevráti", () => {
    expect(applyGoalShares([pos("a", 1, { goalShares: [{ goalId: "g1", percent: 50 }] })], "g1", { a: 50 }, NOW).changed).toEqual([]);
  });
});

describe("záloha a validácia podielov (D-334)", () => {
  const empty = { settings: null, transactions: [], snapshots: [], properties: [], assets: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], dogs: [], stockItems: [], recipes: [], wasteRecords: [], shoppingItems: [] };
  it("záloha v15 s goalId sa načíta ako podiel 100 %", () => {
    const old = { app: "financna-sloboda", schemaVersion: 15, exportedAt: "2026-10-26T10:00:00Z", ...empty, investments: [pos("a", 100, { goalId: "g1" })], goals: [goal("g1", 1000)] };
    const r = parseBackup(old, "2026-10-26");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data?.investments[0].goalShares).toEqual([{ goalId: "g1", percent: 100 }]);
    expect("goalId" in r.data!.investments[0]).toBe(false);
  });
  it("export zapisuje podiely a round trip ich zachová", () => {
    const data = { ...empty, investments: [pos("a", 100, { goalShares: [{ goalId: "g1", percent: 70 }, { goalId: "g2", percent: 30 }] })], goals: [goal("g1", 1000), goal("g2", 500)] };
    const parsed = parseBackup(JSON.parse(JSON.stringify(buildBackup(data as never, "2026-10-26T10:00:00Z"))), "2026-10-26");
    expect(parsed.ok && parsed.data?.investments[0].goalShares).toEqual([{ goalId: "g1", percent: 70 }, { goalId: "g2", percent: 30 }]);
  });
  it("validácia odmietne súčet nad 100, duplicitný cieľ, necelé percento a neznámy cieľ v zálohe", () => {
    const today = "2026-10-26";
    expect(validatePosition(pos("a", 1, { goalShares: [{ goalId: "g1", percent: 70 }, { goalId: "g2", percent: 40 }] }), today).join()).toMatch(/nad 100/);
    expect(validatePosition(pos("a", 1, { goalShares: [{ goalId: "g1", percent: 30 }, { goalId: "g1", percent: 30 }] }), today).join()).toMatch(/opakuje/);
    expect(validatePosition(pos("a", 1, { goalShares: [{ goalId: "g1", percent: 12.5 }] }), today).join()).toMatch(/celé percento/);
    const bad = parseBackup({ app: "financna-sloboda", schemaVersion: 16, exportedAt: "2026-10-26T10:00:00Z", ...empty, investments: [pos("a", 1, { goalShares: [{ goalId: "nie", percent: 50 }] })], goals: [] }, today);
    expect(bad.ok).toBe(false);
  });
});

// D-335: cieľ „zvyšok“ (zakladateľ: čo nepatrí nikam, je automaticky Dôchodok).
describe("cieľ, do ktorého patrí nepriradený zvyšok (D-335)", () => {
  const rest = (id: string, target: number): InvestmentGoal => ({ ...goal(id, target), receivesRest: true });
  it("položka bez cieľa aj nepriradený zvyšok idú do cieľa zvyšku; „bez cieľa“ nevznikne", () => {
    const positions = [pos("a", 1_000), pos("b", 1_000, { goalShares: [{ goalId: "auto", percent: 30 }] })];
    const groups = groupByGoal(positions, [rest("dochodok", 5_000), goal("auto", 1_000)]);
    expect(groups.map((g) => [g.goal?.id, g.totalCents])).toEqual([["dochodok", 100_000 + 70_000], ["auto", 30_000]]);
    expect(groups.some((g) => g.goal === null)).toBe(false);
    expect(groups[0].parts.map((p) => [p.position.id, p.percent])).toEqual([["a", 100], ["b", 70]]);
  });
  it("výslovný podiel v cieli zvyšku sa spočíta s nepriradeným zvyškom", () => {
    const groups = groupByGoal([pos("a", 1_000, { goalShares: [{ goalId: "dochodok", percent: 20 }, { goalId: "auto", percent: 30 }] })], [rest("dochodok", 5_000), goal("auto", 1_000)]);
    expect(groups.map((g) => g.totalCents)).toEqual([70_000, 30_000]);
    expect(groups[0].parts[0].percent).toBe(70);
  });
  it("podiel na zmazaný cieľ ide tiež do cieľa zvyšku", () => {
    const groups = groupByGoal([pos("a", 1_000, { goalShares: [{ goalId: "zmazany", percent: 50 }] })], [rest("dochodok", 5_000)]);
    expect(groups[0].totalCents).toBe(100_000);
  });
  it("INVARIANT: súčet cieľov je vždy celá hodnota investícií aj s cieľom zvyšku", () => {
    fc.assert(fc.property(fc.array(fc.record({ v: fc.integer({ min: 0, max: 5_000_000 }), p1: fc.integer({ min: 0, max: 60 }), p2: fc.integer({ min: 0, max: 40 }) }), { maxLength: 8 }), (items) => {
      const positions = items.map((it, i) => pos(`p${i}`, it.v / 100, { goalShares: [...(it.p1 ? [{ goalId: "g1", percent: it.p1 }] : []), ...(it.p2 ? [{ goalId: "g2", percent: it.p2 }] : [])] }));
      const total = positions.reduce((s, p) => s + positionValueCents(p), 0);
      const groups = groupByGoal(positions, [goal("g1", 1), rest("g2", 1)]);
      expect(groups.reduce((s, g) => s + g.totalCents, 0)).toBe(total);
      expect(groups.some((g) => g.goal === null)).toBe(false);
    }), { numRuns: 200 });
  });
  it("validácia: receivesRest je logická hodnota a v zálohe je najviac jeden takýto cieľ", async () => {
    const { validateGoal } = await import("../src/storage/validate");
    expect(validateGoal({ ...goal("g1", 10), receivesRest: true })).toEqual([]);
    expect(validateGoal({ ...goal("g1", 10), receivesRest: "ano" }).join()).toMatch(/zvyšku/);
    const two = parseBackup({ app: "financna-sloboda", schemaVersion: 16, exportedAt: "2026-10-26T10:00:00Z", settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [], incomes: [], budgets: [], recurringExpenses: [], dogs: [], stockItems: [], recipes: [], wasteRecords: [], shoppingItems: [], goals: [rest("a", 10), rest("b", 10)] }, "2026-10-26");
    expect(two.ok).toBe(false);
  });
});

// D-336: preplnený cieľ. Zakladateľ: cieľ 80 000 €, priradených 1 000 akcií po 249 € (249 000 €): cieľ je preplnený,
// suma navyše sa automaticky presunie do cieľa zvyšku (Dôchodok).
describe("preplnený cieľ presunie sumu navyše do cieľa zvyšku (D-336)", () => {
  const restGoal = (id: string, target: number): InvestmentGoal => ({ ...goal(id, target), receivesRest: true });
  const shares1000 = pos("akcie", 249_000, { goalShares: [{ goalId: "dom", percent: 100 }] });
  it("cieľ je najviac na cieľovej sume; zvyšok ide do Dôchodku", () => {
    const groups = groupByGoal([shares1000], [goal("dom", 80_000), restGoal("dochodok", 500_000)]);
    expect(groups.map((g) => [g.goal?.id, g.totalCents])).toEqual([["dom", 8_000_000], ["dochodok", 16_900_000]]);
    expect(groups[0].overflowOutCents).toBe(16_900_000);
    expect(groups[1].overflowInCents).toBe(16_900_000);
  });
  it("súčet cieľov je stále celá hodnota investícií", () => {
    const groups = groupByGoal([shares1000, pos("b", 1_000)], [goal("dom", 80_000), restGoal("dochodok", 500_000)]);
    expect(groups.reduce((s, g) => s + g.totalCents, 0)).toBe(24_900_000 + 100_000);
  });
  it("bez cieľa zvyšku ide suma navyše do „bez cieľa“", () => {
    const groups = groupByGoal([shares1000], [goal("dom", 80_000)]);
    expect(groups.map((g) => [g.goal?.id ?? null, g.totalCents])).toEqual([["dom", 8_000_000], [null, 16_900_000]]);
    expect(groups[1].overflowInCents).toBe(16_900_000);
  });
  it("cieľ presne naplnený alebo pod cieľom sa nemení; cieľ zvyšku sa neobmedzuje", () => {
    const groups = groupByGoal([pos("a", 1_000, { goalShares: [{ goalId: "dom", percent: 100 }] })], [goal("dom", 1_000), restGoal("dochodok", 10)]);
    expect(groups.map((g) => g.totalCents)).toEqual([100_000, 0]);
    const big = groupByGoal([pos("a", 5_000)], [restGoal("dochodok", 10)]);
    expect(big[0].totalCents).toBe(500_000);
    expect(big[0].overflowInCents ?? 0).toBe(0);
  });
  it("viac preplnených cieľov: všetko navyše ide do cieľa zvyšku", () => {
    const groups = groupByGoal([pos("a", 3_000, { goalShares: [{ goalId: "g1", percent: 50 }, { goalId: "g2", percent: 50 }] })], [goal("g1", 1_000), goal("g2", 1_000), restGoal("r", 1)]);
    expect(groups.map((g) => g.totalCents)).toEqual([100_000, 100_000, 100_000]);
  });
  it("INVARIANT: s obmedzením cieľov a presunom súčet cieľov je vždy celá hodnota investícií", () => {
    fc.assert(fc.property(fc.array(fc.record({ v: fc.integer({ min: 0, max: 5_000_000 }), p1: fc.integer({ min: 0, max: 60 }), p2: fc.integer({ min: 0, max: 40 }) }), { maxLength: 8 }), fc.boolean(), (items, withRest) => {
      const positions = items.map((it, i) => pos(`p${i}`, it.v / 100, { goalShares: [...(it.p1 ? [{ goalId: "g1", percent: it.p1 }] : []), ...(it.p2 ? [{ goalId: "g2", percent: it.p2 }] : [])] }));
      const total = positions.reduce((s, p) => s + positionValueCents(p), 0);
      const groups = groupByGoal(positions, [goal("g1", 500), goal("g2", 300), ...(withRest ? [restGoal("r", 1)] : [])]);
      expect(groups.reduce((s, g) => s + g.totalCents, 0)).toBe(total);
      for (const g of groups) if (g.goal && !g.goal.receivesRest) expect(g.totalCents).toBeLessThanOrEqual(g.goal.targetCents);
    }), { numRuns: 200 });
  });
});
