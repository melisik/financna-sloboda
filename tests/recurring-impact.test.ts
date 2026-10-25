import { describe, expect, it } from "vitest";
import { averageWindow, categoryAverages, hasHistory, recurringImpact } from "../src/domain/recurringImpact";
import { earlierText } from "../src/features/mesacny-vydavok/recurringText";
import type { RecurringExpense, Transaction } from "../src/domain/model/entities";

// Opakované výdavky a dátum cieľa (D-290, docs/45: U1, V3, S1). Syntetické hodnoty v centoch.
const eur = (x: number) => Math.round(x * 100);
const tx = (date: string, amount: number, category?: Transaction["category"], type: Transaction["type"] = "vydavok"): Transaction => ({
  id: `${date}-${amount}-${category ?? "x"}`, date, type, amountCents: eur(amount), ...(type === "vydavok" ? { source: "z_prijmu" as const } : {}),
  ...(category ? { category } : {}), createdAt: `${date}T10:00:00Z`, updatedAt: `${date}T10:00:00Z`,
});
const rec = (name: string, amount: number, category: RecurringExpense["category"], frequency: RecurringExpense["frequency"] = "mesacne", startDate = "2026-01-01", endDate?: string): RecurringExpense => ({
  id: name, name, category, frequency, amountCents: eur(amount), startDate, ...(endDate ? { endDate } : {}), createdAt: "2026-01-01T10:00:00Z", updatedAt: "2026-01-01T10:00:00Z",
});
// r = 0, K = 300 000 €, cieľ 600 000 €, sporenie 1 000 € do investícií → 300 mesiacov; +500 € → 200 mesiacov.
const goal = { capital: { inv: eur(300_000), cash: 0 }, mInv: eur(1_000), mCash: 0, rate: 0, targetCents: eur(600_000), rentals: [] };

describe("okno priemeru a história", () => {
  it("posledné 3 celé kalendárne mesiace pred dneškom", () => {
    expect(averageWindow("2026-10-24")).toEqual({ from: "2026-07-01", to: "2026-09-30" });
    expect(averageWindow("2026-01-15")).toEqual({ from: "2025-10-01", to: "2025-12-31" });
  });

  it("história je výdavok v každom z 3 mesiacov okna; iné typy a jedna stará transakcia nestačia (D-296, revízia S-3)", () => {
    const w = { from: "2026-07-01", to: "2026-09-30" };
    expect(hasHistory([tx("2026-07-31", 10, "jedlo"), tx("2026-08-01", 10), tx("2026-09-30", 10, "zábava")], w)).toBe(true);
    expect(hasHistory([tx("2025-01-05", 10, "jedlo"), tx("2026-09-10", 10, "jedlo")], w)).toBe(false);
    expect(hasHistory([tx("2026-07-05", 10, "jedlo"), tx("2026-08-05", 500, undefined, "sporenie"), tx("2026-09-05", 10, "jedlo")], w)).toBe(false);
    expect(hasHistory([], w)).toBe(false);
  });

  it("priemer kategórie je súčet výdavkov v okne delený 3; mimo okna, iné typy a nuly sa nerátajú; bez kategórie je „nezaradené“", () => {
    const list = [
      tx("2026-06-30", 999, "jedlo"), tx("2026-07-01", 30, "jedlo"), tx("2026-08-15", 60, "jedlo"), tx("2026-09-30", 90, "jedlo"),
      tx("2026-10-01", 999, "jedlo"), tx("2026-08-02", 500, undefined, "sporenie"), tx("2026-09-10", 15),
    ];
    expect(categoryAverages(list, { from: "2026-07-01", to: "2026-09-30" })).toEqual([
      { name: "jedlo", category: "jedlo", monthlyCents: eur(60) },
      { name: "nezaradené", category: null, monthlyCents: eur(5) },
    ]);
  });
});

describe("dopad opakovaných výdavkov na dátum cieľa", () => {
  it("suma sa pripočíta k sporeniu do investícií (S1): 500 € mesačne = o 100 mesiacov skôr", () => {
    const r = recurringImpact({ ...goal, transactions: [], recurring: [rec("Nájom", 500, "bývanie")], today: "2026-10-24" });
    expect(r.status).toBe("ok");
    if (r.status !== "ok") return;
    expect(r.groups).toHaveLength(1);
    expect(r.groups[0].items[0]).toMatchObject({ kind: "pravidelny", name: "Nájom", monthlyCents: eur(500) });
    expect(r.groups[0].items[0].monthsEarlier).toBeCloseTo(100, 6);
  });

  it("ročný pravidelný výdavok sa delí 12; ukončený a budúci sa nerátajú", () => {
    const r = recurringImpact({
      ...goal, transactions: [], today: "2026-10-24",
      recurring: [rec("Poistenie", 240, "dom a energie", "rocne"), rec("Starý paušál", 30, "predplatné a služby", "mesacne", "2025-01-01", "2026-09-30"), rec("Budúci", 10, "zábava", "mesacne", "2026-11-01")],
    });
    if (r.status !== "ok") throw new Error(r.status);
    const items = r.groups.flatMap((g) => g.items);
    expect(items.map((i) => i.name)).toEqual(["Poistenie"]);
    expect(items[0]).toMatchObject({ monthlyCents: eur(20), yearlyCents: eur(240) });
  });

  it("skupiny v poradí nie nevyhnutné, ostatné, nevyhnutné (V3); v skupine od najvyššej sumy; prázdne skupiny chýbajú", () => {
    const transactions = [tx("2026-07-01", 300, "jedlo"), tx("2026-08-10", 90, "zábava"), tx("2026-09-10", 30, "iné")];
    const r = recurringImpact({ ...goal, transactions, recurring: [rec("Streaming", 12, "predplatné a služby"), rec("Nájom", 500, "bývanie")], today: "2026-10-24" });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.categoriesShown).toBe(true);
    expect(r.groups.map((g) => g.necessity)).toEqual(["nie_nevyhnutne", "ostatne", "nevyhnutne"]);
    expect(r.groups[0].items.map((i) => i.name)).toEqual(["zábava", "Streaming"]);
    expect(r.groups[2].items.map((i) => i.name)).toEqual(["Nájom", "jedlo"]);
  });

  it("pri kratšej histórii sa ukážu len pravidelné výdavky", () => {
    const r = recurringImpact({ ...goal, transactions: [tx("2026-08-10", 90, "zábava")], recurring: [rec("Streaming", 12, "predplatné a služby")], today: "2026-10-24" });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.categoriesShown).toBe(false);
    expect(r.groups.flatMap((g) => g.items).map((i) => i.name)).toEqual(["Streaming"]);
  });

  it("bez dosiahnuteľného dátumu cieľa (bez sporenia alebo viac ako 50 rokov) sa nič nepočíta", () => {
    expect(recurringImpact({ ...goal, mInv: 0, transactions: [], recurring: [rec("Nájom", 500, "bývanie")], today: "2026-10-24" })).toEqual({ status: "no_goal", reason: "far" });
    expect(recurringImpact({ ...goal, mInv: eur(100), transactions: [], recurring: [rec("Nájom", 500, "bývanie")], today: "2026-10-24" })).toEqual({ status: "no_goal", reason: "far" });
  });

  it("dosiahnutý cieľ má vlastný dôvod (revízia N-2)", () => {
    expect(recurringImpact({ ...goal, capital: { inv: eur(600_000), cash: 0 }, transactions: [], recurring: [rec("Nájom", 500, "bývanie")], today: "2026-10-24" })).toEqual({ status: "no_goal", reason: "reached" });
  });

  it("kategória dôchodok sa nezobrazuje ani ako pravidelný výdavok, ani ako priemer: je to sporenie (D-296, revízia S-2)", () => {
    const transactions = [tx("2026-07-01", 100, "dôchodok"), tx("2026-08-01", 100, "dôchodok"), tx("2026-09-01", 100, "dôchodok"), tx("2026-09-02", 30, "jedlo")];
    const r = recurringImpact({ ...goal, transactions, recurring: [rec("III. pilier", 50, "dôchodok"), rec("Nájom", 500, "bývanie")], today: "2026-10-24" });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.groups.flatMap((g) => g.items).map((i) => i.name)).toEqual(["Nájom", "jedlo"]);
  });

  it("riadky majú jedinečný kľúč aj pri rovnakom názve pravidelného výdavku (revízia N-3)", () => {
    const a = { ...rec("Poistenie", 10, "zdravie"), id: "a" };
    const b = { ...rec("Poistenie", 20, "zdravie"), id: "b" };
    const r = recurringImpact({ ...goal, transactions: [], recurring: [a, b], today: "2026-10-24" });
    if (r.status !== "ok") throw new Error(r.status);
    expect(r.groups.flatMap((g) => g.items).map((i) => i.key)).toEqual(["pravidelny-b", "pravidelny-a"]);
  });
});

describe("text riadku", () => {
  it("o N mesiacov skôr; pod 1 mesiac slovom", () => {
    expect(earlierText(100)).toBe("o 100 mesiacov skôr");
    expect(earlierText(2.4)).toBe("o 2 mesiace skôr");
    expect(earlierText(0.6)).toBe("o 1 mesiac skôr");
    expect(earlierText(0.4)).toBe("menej ako 1 mesiac skôr");
  });
});
