import { describe, expect, it } from "vitest";
import { budgetStatus, spentInMonthCents } from "../src/domain/budget";
import { validateBudget, validateTransaction } from "../src/storage/validate";
import type { Transaction } from "../src/storage/types";

// D-106: rozpočet kategórií. Syntetické hodnoty.
const TODAY = "2026-10-19";
const vydavok = (id: string, date: string, amountCents: number, category?: Transaction["category"]): Transaction => ({
  id,
  date,
  type: "vydavok",
  amountCents,
  source: "z_hotovosti",
  ...(category ? { category } : {}),
  createdAt: "2026-10-19T10:00:00Z",
  updatedAt: "2026-10-19T10:00:00Z",
});

describe("rozpočet kategórií (D-106)", () => {
  const list = [
    vydavok("a", "2026-10-02", 12_000, "jedlo"),
    vydavok("b", "2026-10-15", 5_000, "jedlo"),
    vydavok("c", "2026-09-30", 9_000, "jedlo"), // iný mesiac
    vydavok("d", "2026-10-10", 3_000), // bez kategórie
    { ...vydavok("e", "2026-10-11", 4_000, "zábava"), type: "sporenie", source: undefined } as Transaction,
  ];

  it("sčítava výdavky v kategórii len za aktuálny mesiac", () => {
    expect(spentInMonthCents(list, "jedlo", TODAY)).toBe(17_000);
    expect(spentInMonthCents(list, null, TODAY)).toBe(3_000);
  });

  it("stav limitu: zostáva, alebo prekročené", () => {
    const b = { id: "jedlo", category: "jedlo" as const, limitCents: 30_000, updatedAt: TODAY };
    expect(budgetStatus(b, 17_000)).toEqual({ remainingCents: 13_000, over: false });
    expect(budgetStatus(b, 35_000)).toEqual({ remainingCents: 5_000, over: true });
    expect(budgetStatus(undefined, 1_000)).toBeNull();
  });

  it("kategória patrí len k výdavku a musí byť z katalógu", () => {
    expect(validateTransaction(vydavok("x", "2026-10-02", 100, "jedlo"), TODAY)).toEqual([]);
    expect(validateTransaction(vydavok("x", "2026-10-02", 100, "krypto" as never), TODAY).join(" ")).toMatch(/kategória/);
    const sporenie = { ...vydavok("y", "2026-10-02", 100, "jedlo"), type: "sporenie", source: undefined } as unknown as Transaction;
    expect(validateTransaction(sporenie, TODAY).join(" ")).toMatch(/kategória/);
  });

  it("limit musí byť kladný a id sa musí zhodovať s kategóriou", () => {
    expect(validateBudget({ id: "jedlo", category: "jedlo", limitCents: 30_000, updatedAt: TODAY })).toEqual([]);
    expect(validateBudget({ id: "iné", category: "jedlo", limitCents: 30_000, updatedAt: TODAY }).join(" ")).toMatch(/id musí byť/);
    expect(validateBudget({ id: "jedlo", category: "jedlo", limitCents: 0, updatedAt: TODAY }).join(" ")).toMatch(/limit/);
  });
});
