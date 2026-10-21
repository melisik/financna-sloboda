import { describe, expect, it } from "vitest";
import { parseBackup } from "../src/storage/backup";

// Neúplná záloha nesmie zhodiť overenie (predtým výnimka bez správy pre používateľa). Syntetické hodnoty.
describe("neúplná záloha", () => {
  it("vráti chyby polí, nehodí výnimku", () => {
    const res = parseBackup({ app: "financna-sloboda", schemaVersion: 6, exportedAt: "2026-10-21T00:00:00Z" }, "2026-10-21");
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.errors).toContain("záloha: transactions musí byť pole");
    expect(res.errors).toContain("záloha: snapshots musí byť pole");
  });
});
