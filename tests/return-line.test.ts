import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { returnLine } from "../src/features/prehlad/returnLine";

// Výnos na Prehľade (D-263, D-282): text uvádza tú istú infláciu, z ktorej počíta nominálny výnos.
describe("riadok výnosu na Prehľade", () => {
  it("pri r = 3,5 % a inflácii 4,2 % uvádza nominálne ≈ 7,8 % a infláciu 4,2 %", () => {
    expect(returnLine(0.035, 0.042)).toBe("Výnos: 3,5 % reálne po poplatkoch, nominálne ≈ 7,8 % pri inflácii 4,2 % (predpoklad).");
  });

  it("iná inflácia zmení oba údaje, nie len jeden", () => {
    expect(returnLine(0.035, 0.02)).toBe("Výnos: 3,5 % reálne po poplatkoch, nominálne ≈ 5,6 % pri inflácii 2,0 % (predpoklad).");
  });

  it("Prehľad nemá infláciu napísanú v texte natvrdo", () => {
    expect(readFileSync("src/features/prehlad/Prehlad.tsx", "utf8")).not.toMatch(/inflácii \d/);
  });
});
