import { describe, expect, it } from "vitest";
import { validateAttachmentRecord } from "../src/storage/validate";

// Príloha patrí presne k jednému výdavku alebo záznamu prenájmu (D-221). Syntetické hodnoty.
const base = { id: "p1", name: "doklad.png", type: "image/png", size: 100, createdAt: "2026-10-22T10:00:00.000Z", dataBase64: "AAAA" };

describe("vlastník prílohy (D-221)", () => {
  it("príloha k výdavku z transakcie je v poriadku", () => {
    expect(validateAttachmentRecord({ ...base, transactionId: "t1" })).toEqual([]);
  });

  it("príloha k výdavku z prenájmu je v poriadku", () => {
    expect(validateAttachmentRecord({ ...base, rentalEntryId: "r1" })).toEqual([]);
  });

  it("príloha bez vlastníka sa odmietne", () => {
    expect(validateAttachmentRecord(base)).toHaveLength(1);
  });

  it("príloha s dvoma vlastníkmi sa odmietne", () => {
    expect(validateAttachmentRecord({ ...base, transactionId: "t1", rentalEntryId: "r1" })).toHaveLength(1);
  });
});
