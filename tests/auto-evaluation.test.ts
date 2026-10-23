import { describe, expect, it } from "vitest";
import { autoSnapshot, lastCompletedMonthEnd } from "../src/app/autoEvaluation";
import type { Snapshot, Transaction } from "../src/storage/types";

// D-116: automatické vyhodnotenie. Syntetické hodnoty.
const latest: Snapshot = { id: "s1", date: "2026-09-30", investmentsCents: 10_000_000, cashCents: 2_000_000, createdAt: "2026-09-30T20:00:00Z" };
const tx = (id: string, date: string, type: Transaction["type"], amountCents: number, source?: Transaction["source"]): Transaction => ({
  id, date, type, amountCents, ...(source ? { source } : {}), createdAt: `${date}T10:00:00Z`, updatedAt: `${date}T10:00:00Z`,
});
const base = { latest, realReturn: 0, id: "auto1", now: "2026-11-02T08:00:00Z" };

describe("koniec predchádzajúceho mesiaca", () => {
  it("vracia posledný deň predchádzajúceho mesiaca, aj pri januári", () => {
    expect(lastCompletedMonthEnd("2026-11-02")).toBe("2026-10-31");
    expect(lastCompletedMonthEnd("2026-03-01")).toBe("2026-02-28");
    expect(lastCompletedMonthEnd("2027-01-05")).toBe("2026-12-31");
  });
});

describe("automatické vyhodnotenie (D-116)", () => {
  it("bez ručného vyhodnotenia alebo ak posledný ukončený mesiac už je zachytený, nevytvorí nič", () => {
    expect(autoSnapshot({ ...base, latest: null, transactions: [], positionsTotalCents: null, today: "2026-11-02" })).toBeNull();
    expect(autoSnapshot({ ...base, latest: { ...latest, date: "2026-10-31" }, transactions: [], positionsTotalCents: null, today: "2026-11-02" })).toBeNull();
  });

  it("hotovosť sa posunie o sporenie a výdavky; budúce transakcie sa nezarátajú", () => {
    const txs = [tx("a", "2026-10-05", "sporenie", 25_000), tx("b", "2026-10-09", "vydavok", 15_000, "z_hotovosti"), tx("c", "2026-11-03", "sporenie", 99_900)];
    const snap = autoSnapshot({ ...base, transactions: txs, positionsTotalCents: null, today: "2026-11-02" });
    expect(snap).toMatchObject({ date: "2026-10-31", cashCents: 2_010_000, auto: true });
  });

  it("bez položiek investícií sa hodnota zvýši o mesačný výnos za každý mesiac", () => {
    // 100 000 € pri 12 % p. a. za jeden mesiac: 100 000 × (1 + i), kde i = 1,12^(1/12) − 1
    const snap = autoSnapshot({ ...base, realReturn: 0.12, transactions: [], positionsTotalCents: null, today: "2026-11-02" });
    expect(snap?.investmentsCents).toBe(Math.round(10_000_000 * Math.pow(1.12, 1 / 12)));
  });

  it("vklad do investícií v období sa zhodnotí len od vkladu, nie za celé obdobie (audit, nález 9)", () => {
    const txs = [tx("d", "2026-10-15", "investicia", 500_000, "z_hotovosti")];
    const snap = autoSnapshot({ ...base, realReturn: 0.12, transactions: txs, positionsTotalCents: null, today: "2026-11-02" });
    expect(snap?.investmentsCents).toBe(Math.round(10_000_000 * Math.pow(1.12, 1 / 12)) + 500_000);
  });

  it("ak existujú položky investícií, použije sa ich súčet a výnos sa nepridáva (D-122)", () => {
    const snap = autoSnapshot({ ...base, realReturn: 0.12, transactions: [], positionsTotalCents: 12_000_000, today: "2026-11-02" });
    expect(snap?.investmentsCents).toBe(12_000_000);
  });
});
