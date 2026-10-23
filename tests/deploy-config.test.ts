import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Verejné nasadenie len z vetvy main (D-056, D-217, D-228). Test číta konfiguráciu a nič nenasadzuje.
describe("nasadenie na verejnú stránku (D-056)", () => {
  it("pages.yml sa spúšťa len pri push na main", () => {
    const yml = readFileSync(join(__dirname, "..", ".github", "workflows", "pages.yml"), "utf8");
    expect(yml).toMatch(/branches:\s*\[main\]/);
  });
});
