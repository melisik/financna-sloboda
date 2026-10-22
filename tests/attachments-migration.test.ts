import "fake-indexeddb/auto";
import { openDB } from "idb";
import { describe, expect, it } from "vitest";
import { openRepository } from "../src/storage/indexeddb";

// Migrácia úložiska z verzie 7 na 8: prílohy k výdavkom z prenájmu dostanú index (D-221). Syntetické hodnoty.
let counter = 0;
const freshName = () => `attachments-migration-test-${++counter}-${Date.now()}`;

describe("migrácia úložiska na verziu 8 (D-221)", () => {
  it("existujúce prílohy zostanú a záznamy prenájmu sa dajú pridať a zmazať", async () => {
    const name = freshName();
    const old = await openDB(name, 7, {
      upgrade(d) {
        const attachments = d.createObjectStore("attachments", { keyPath: "id" });
        attachments.createIndex("transactionId", "transactionId");
      },
    });
    await old.put("attachments", { id: "a1", transactionId: "t1", name: "doklad.png", type: "image/png", size: 3, createdAt: "2026-10-20T10:00:00Z", data: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }) });
    old.close();

    const repo = await openRepository(name);
    expect((await repo.listAttachments("t1")).map((a) => a.id)).toEqual(["a1"]);

    await repo.saveAttachment({ id: "r1", rentalEntryId: "e1", name: "najom.pdf", type: "application/pdf", size: 3, createdAt: "2026-10-22T10:00:00Z", data: new Blob([new Uint8Array([1, 2, 3])], { type: "application/pdf" }) });
    expect((await repo.listRentalAttachments("e1")).map((a) => a.id)).toEqual(["r1"]);
    expect((await repo.listAttachments("t1")).map((a) => a.id)).toEqual(["a1"]);

    await repo.deleteAttachmentsForRentalEntries(["e1"]);
    expect(await repo.listRentalAttachments("e1")).toEqual([]);
    expect((await repo.listAttachments("t1")).map((a) => a.id)).toEqual(["a1"]);
  });
});
