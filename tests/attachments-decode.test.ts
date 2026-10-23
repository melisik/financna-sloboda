import { describe, expect, it } from "vitest";
import { decodeAttachmentRecord } from "../src/storage/attachments";
import type { AttachmentRecord } from "../src/storage/types";

// Dekódovanie prílohy zo zálohy: deklarovaná veľkosť musí zodpovedať obsahu (A-09). Syntetické hodnoty.
// "YWJj" je base64 pre tri bajty „abc“.
const record = (size: number): AttachmentRecord => ({
  id: "p1", transactionId: "t1", name: "doklad.pdf", type: "application/pdf", size, createdAt: "2026-10-22T10:00:00.000Z", dataBase64: "YWJj",
});

describe("dekódovanie prílohy zo zálohy (A-09)", () => {
  it("zhodná veľkosť prejde a obsah sa zachová", () => {
    const a = decodeAttachmentRecord(record(3));
    expect(a.data.size).toBe(3);
    expect(a.name).toBe("doklad.pdf");
  });

  it("nezhodná veľkosť sa odmietne", () => {
    expect(() => decodeAttachmentRecord(record(5))).toThrow();
  });
});
