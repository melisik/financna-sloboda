import { describe, expect, it } from "vitest";
import { BACKUP_MAX_BYTES, backupTooLarge } from "../src/storage/backup";

// Audit A-02, rozhodnutie D-132: súbor zálohy nad 100 MB sa neobnoví.
describe("limit veľkosti súboru zálohy (A-02, D-132)", () => {
  it("limit je 100 MB", () => {
    expect(BACKUP_MAX_BYTES).toBe(100 * 1024 * 1024);
  });

  it("záloha presne na limite sa ešte načíta", () => {
    expect(backupTooLarge(BACKUP_MAX_BYTES)).toBe(false);
  });

  it("záloha o bajt nad limitom sa nenačíta", () => {
    expect(backupTooLarge(BACKUP_MAX_BYTES + 1)).toBe(true);
  });
});
