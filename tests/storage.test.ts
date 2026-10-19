import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { buildBackup, parseBackup } from "../src/storage/backup";
import { openRepository } from "../src/storage/indexeddb";
import type { AppData, Transaction } from "../src/storage/types";

const TODAY = "2026-10-14";
let dbSeq = 0;
const freshName = () => `test-db-${++dbSeq}-${Math.random().toString(36).slice(2)}`;

const sample: AppData = {
  settings: {
    expensesCents: 2_400_000,
    withdrawalRate: 0.037,
    realReturn: 0.035,
    reserveCents: 600_000,
    thresholdCents: 10_000,
    savingInvCents: 50_000,
    savingCashCents: 0,
    lastReviewDate: "2026-09-30",
  },
  transactions: [
    { id: "t1", date: "2026-10-01", type: "sporenie", amountCents: 50_000, createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T10:00:00Z" },
    { id: "t2", date: "2026-10-05", type: "vydavok", amountCents: 15_000, source: "z_hotovosti", note: "syntetický výdavok", createdAt: "2026-10-05T10:00:00Z", updatedAt: "2026-10-05T10:00:00Z" },
  ],
  snapshots: [{ id: "s1", date: "2026-09-30", investmentsCents: 10_000_000, cashCents: 2_000_000, createdAt: "2026-09-30T20:00:00Z" }],
  properties: [],
  assets: [],
  investments: [],
};

// Neplatné fixtúry sú zámerne mimo typu, preto vstup je unknown (buildBackup len obalí dáta).
const txJson = (data: unknown) => JSON.stringify(buildBackup(data as AppData, "2026-10-14T10:00:00Z"));

describe("CRUD v IndexedDB (FR-16)", () => {
  it("pridá, načíta a zmaže transakciu", async () => {
    const repo = await openRepository(freshName());
    const t: Transaction = { id: "x", date: TODAY, type: "investicia", amountCents: 100, createdAt: "a", updatedAt: "a" };
    await repo.addTransaction(t);
    expect((await repo.getData()).transactions).toEqual([t]);
    await repo.deleteTransaction("x");
    expect((await repo.getData()).transactions).toEqual([]);
    repo.close();
  });
});

describe("záloha: export a import (FR-17, FR-18)", () => {
  it("round trip: export → import → export dá rovnaký obsah okrem exportedAt", async () => {
    const repoA = await openRepository(freshName());
    await repoA.replaceAll(sample);
    const exported = buildBackup(await repoA.getData(), "2026-10-14T10:00:00Z");

    const parsed = parseBackup(JSON.parse(JSON.stringify(exported)), TODAY);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    const repoB = await openRepository(freshName());
    await repoB.replaceAll(parsed.data!);
    const again = buildBackup(await repoB.getData(), "2026-10-14T10:00:00Z");
    expect(again).toEqual(exported);
    repoA.close();
    repoB.close();
  });

  it("import nahradí existujúce dáta", async () => {
    const repo = await openRepository(freshName());
    await repo.addTransaction({ id: "stara", date: TODAY, type: "sporenie", amountCents: 1, createdAt: "a", updatedAt: "a" });
    await repo.replaceAll(sample);
    const ids = (await repo.getData()).transactions.map((t) => t.id).sort();
    expect(ids).toEqual(["t1", "t2"]);
    repo.close();
  });

  it("neplatný JSON: chyba a nič sa nezmení", () => {
    const parsed = parseBackup("nie je to objekt", TODAY);
    expect(parsed.ok).toBe(false);
  });

  it("záporná suma je odmietnutá", () => {
    const bad = { ...sample, transactions: [{ ...sample.transactions[0], amountCents: -100 }] };
    const parsed = parseBackup(JSON.parse(txJson(bad)), TODAY);
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.errors.join(" ")).toMatch(/kladné celé číslo/);
  });

  it("budúci dátum transakcie je odmietnutý", () => {
    const bad = { ...sample, transactions: [{ ...sample.transactions[0], date: "2026-12-01" }] };
    const parsed = parseBackup(JSON.parse(txJson(bad)), TODAY);
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.errors.join(" ")).toMatch(/budúcnosti/);
  });

  it("duplicitné id je odmietnuté (R16)", () => {
    const dup = { ...sample, transactions: [sample.transactions[0], { ...sample.transactions[0], amountCents: 1 }] };
    const parsed = parseBackup(JSON.parse(txJson(dup)), TODAY);
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.errors.join(" ")).toMatch(/duplicitné id/);
  });

  it("zdroj úhrady pri sporení je odmietnutý (R25)", () => {
    const bad = { ...sample, transactions: [{ ...sample.transactions[0], source: "z_prijmu" }] };
    const parsed = parseBackup(JSON.parse(txJson(bad)), TODAY);
    expect(parsed.ok).toBe(false);
  });

  it("neznáme pole je odmietnuté", () => {
    const bad = { ...sample, transactions: [{ ...sample.transactions[0], hack: true }] };
    const parsed = parseBackup(JSON.parse(txJson(bad)), TODAY);
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.errors.join(" ")).toMatch(/neznáme pole/);
  });

  it("vyššia verzia schémy je odmietnutá", () => {
    const parsed = parseBackup({ app: "financna-sloboda", schemaVersion: 3, exportedAt: "x", settings: null, transactions: [], snapshots: [] }, TODAY);
    expect(parsed.ok).toBe(false);
    expect(!parsed.ok && parsed.errors.join(" ")).toMatch(/novšej verzie/);
  });

  it("výdavok bez zdroja úhrady je odmietnutý", () => {
    const bad = { ...sample, transactions: [{ ...sample.transactions[1], source: undefined }] };
    const parsed = parseBackup(JSON.parse(txJson(bad)), TODAY);
    expect(parsed.ok).toBe(false);
  });
});

describe("atomicita zápisu (FR-18, 07 §6)", () => {
  it("ak zápis zlyhá uprostred, pôvodné dáta zostanú", async () => {
    const repo = await openRepository(freshName());
    await repo.replaceAll(sample);
    // Neplatný kľúč (chýba id) spôsobí zlyhanie zápisu uprostred transakcie.
    const broken: AppData = {
      ...sample,
      transactions: [
        { id: "nova", date: TODAY, type: "sporenie", amountCents: 1, createdAt: "a", updatedAt: "a" },
        { ...sample.transactions[0], id: undefined as unknown as string },
      ],
    };
    await expect(repo.replaceAll(broken)).rejects.toThrow();
    const after = await repo.getData();
    expect(after.transactions.map((t) => t.id).sort()).toEqual(["t1", "t2"]);
    repo.close();
  });
});
