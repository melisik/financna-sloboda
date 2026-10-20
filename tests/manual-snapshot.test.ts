import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { openRepository } from "../src/storage/indexeddb";
import type { Snapshot } from "../src/storage/types";

// Ručné vyhodnotenie zmaže neskoršie auto-vyhodnotenia (D-116). Syntetické hodnoty.
let counter = 0;
const freshName = () => `manual-snapshot-test-${++counter}-${Date.now()}`;

function snap(id: string, date: string, auto = false): Snapshot {
  return { id, date, investmentsCents: 10_000_00, cashCents: 0, createdAt: `${date}T00:00:00Z`, auto };
}

describe("ručné vyhodnotenie", () => {
  it("zmaže auto-vyhodnotenie na neskorší dátum, starší auto a ručné ponechá", async () => {
    const repo = await openRepository(freshName());
    await repo.addSnapshot(snap("m1", "2026-01-01"));
    await repo.addSnapshot(snap("a-late", "2026-09-30", true));
    await repo.addSnapshot(snap("a-early", "2026-02-28", true));
    await repo.addSnapshot(snap("m-late", "2026-10-01"));

    await repo.addManualSnapshot(snap("m2", "2026-07-01"));

    const ids = (await repo.getData()).snapshots.map((s) => s.id).sort();
    expect(ids).toEqual(["a-early", "m-late", "m1", "m2"].sort());
    repo.close();
  });

  it("uložené ručné vyhodnotenie sa zapíše aj bez auto-vyhodnotení", async () => {
    const repo = await openRepository(freshName());
    await repo.addManualSnapshot(snap("m1", "2026-01-01"));
    expect((await repo.getData()).snapshots.map((s) => s.id)).toEqual(["m1"]);
    repo.close();
  });

  it("zmazanie odstráni len vybrané vyhodnotenie", async () => {
    const repo = await openRepository(freshName());
    await repo.addManualSnapshot(snap("m1", "2026-01-01"));
    await repo.addManualSnapshot(snap("m2", "2026-07-01"));
    await repo.deleteSnapshot("m2");
    expect((await repo.getData()).snapshots.map((s) => s.id)).toEqual(["m1"]);
    repo.close();
  });
});
