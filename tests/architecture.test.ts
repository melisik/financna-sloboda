import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Vertikálne pravidlo (D-162, docs/21): doména ani jadro nesmú závisieť od UI ani od stavu modulov.
const SRC = join(__dirname, "..", "src");

function importsOf(dir: string): { file: string; spec: string }[] {
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts"))
    .flatMap((f) => {
      const file = join(dir, f);
      const text = readFileSync(file, "utf8");
      return [...text.matchAll(/from "([^"]+)"/g)].map((m) => ({ file: f, spec: m[1] }));
    });
}

describe("pravidlo závislostí (D-162)", () => {
  it("doména nikdy neimportuje UI, aplikačnú vrstvu ani register modulov", () => {
    const bad = importsOf(join(SRC, "domain")).filter(
      (i) => i.spec.startsWith("../ui") || i.spec.startsWith("../app"),
    );
    expect(bad).toEqual([]);
  });

  it("register modulov je čistý: neimportuje UI ani nič z aplikačnej vrstvy", () => {
    const bad = importsOf(join(SRC, "app")).filter((i) => i.file === "modules.ts" && i.spec.startsWith("."));
    expect(bad).toEqual([]);
  });
});
