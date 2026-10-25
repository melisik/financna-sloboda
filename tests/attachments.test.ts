import { describe, expect, it } from "vitest";
import { buildBackup, parseBackup } from "../src/storage/backup";
import { encodeAttachment } from "../src/storage/attachments";
import type { AppData, Attachment, Transaction } from "../src/storage/types";

// Prílohy k výdavkom v zálohe (D-160). Syntetické hodnoty.
const TODAY = "2026-10-22";
const expense: Transaction = { id: "t1", date: "2026-10-20", type: "vydavok", amountCents: 1220, source: "z_hotovosti", category: "jedlo", createdAt: "x", updatedAt: "x" };
const data: AppData = {
  settings: null, transactions: [expense], snapshots: [], properties: [], assets: [], investments: [], liabilities: [],
  incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [], dogs: [], goals: [], wasteRecords: [], shoppingItems: [],
};
const att: Attachment = { id: "a1", transactionId: "t1", name: "doklad.png", type: "image/png", size: 3, createdAt: "2026-10-20T10:00:00Z", data: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }) };

describe("prílohy v zálohe (D-160)", () => {
  it("export a import zachová prílohu aj s obsahom", async () => {
    const record = await encodeAttachment(att);
    const json = JSON.parse(JSON.stringify(buildBackup(data, "2026-10-22T10:00:00Z", [record])));
    const parsed = parseBackup(json, TODAY);
    expect(parsed.ok).toBe(true);
    const restored = parsed.attachments!;
    expect(restored).toHaveLength(1);
    expect(restored[0].name).toBe("doklad.png");
    expect(restored[0].size).toBe(3);
    expect(Array.from(new Uint8Array(await restored[0].data.arrayBuffer()))).toEqual([1, 2, 3]);
  });

  it("príloha k neexistujúcemu výdavku sa odmietne a nič sa nenačíta", async () => {
    const record = { ...(await encodeAttachment(att)), transactionId: "chybajuci" };
    const parsed = parseBackup(JSON.parse(JSON.stringify(buildBackup(data, "2026-10-22T10:00:00Z", [record]))), TODAY);
    expect(parsed.ok).toBe(false);
    expect(parsed.ok ? "" : parsed.errors.join(" ")).toMatch(/patrí k výdavku alebo záznamu prenájmu, ktorý v zálohe nie je/);
  });

  it("príloha k výdavku z prenájmu sa obnoví, ak je záznam v zálohe (D-221)", async () => {
    const property = { id: "m1", name: "Byt syntetický", mode: "prenajom", valueCents: 15000000, valueDate: "2026-10-01", mortgageBalanceCents: 0, createdAt: "2026-10-01T10:00:00Z", updatedAt: "2026-10-01T10:00:00Z", rentalLedger: [{ id: "r1", date: "2026-10-20", kind: "vydavok", amountCents: 3500 }] };
    const rentalData = { ...data, properties: [property] } as unknown as AppData;
    const record = { ...(await encodeAttachment({ ...att, transactionId: undefined, rentalEntryId: "r1" })) };
    const parsed = parseBackup(JSON.parse(JSON.stringify(buildBackup(rentalData, "2026-10-22T10:00:00Z", [record]))), TODAY);
    expect(parsed.ok).toBe(true);
    expect(parsed.attachments![0].rentalEntryId).toBe("r1");
  });

  it("príloha zlého typu alebo nad 2 MB sa odmietne", async () => {
    const record = await encodeAttachment(att);
    const badType = parseBackup(JSON.parse(JSON.stringify(buildBackup(data, "x", [{ ...record, type: "text/plain" }]))), TODAY);
    expect(badType.ok).toBe(false);
    const tooBig = parseBackup(JSON.parse(JSON.stringify(buildBackup(data, "x", [{ ...record, size: 3 * 1024 * 1024 }]))), TODAY);
    expect(tooBig.ok).toBe(false);
  });

  it("záloha bez príloh (staršia) sa načíta s prázdnym zoznamom", () => {
    const parsed = parseBackup(JSON.parse(JSON.stringify(buildBackup(data, "x"))), TODAY);
    expect(parsed.ok && parsed.attachments).toEqual([]);
  });
});
