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
  it("doména nikdy neimportuje UI, aplikačnú vrstvu, úložisko ani register modulov (D-171)", () => {
    const bad = importsOf(join(SRC, "domain")).filter(
      (i) => i.spec.startsWith("../ui") || i.spec.startsWith("../app") || i.spec.startsWith("../storage"),
    );
    expect(bad).toEqual([]);
  });

  it("doména importuje len vlastné súbory (./), nikdy nadradené priečinky (D-171)", () => {
    const up = importsOf(join(SRC, "domain")).filter((i) => i.spec.startsWith(".."));
    expect(up).toEqual([]);
  });

  it("spoločné prvky (ui/kit) neimportujú doménu, úložisko ani sekcie aplikácie (D-173)", () => {
    const bad = readdirSync(join(SRC, "ui", "kit"))
      .filter((f) => /\.tsx?$/.test(f))
      .flatMap((f) => [...readFileSync(join(SRC, "ui", "kit", f), "utf8").matchAll(/from "([^"]+)"/g)].map((m) => ({ f, spec: m[1] })))
      .filter((i) => i.spec !== "react" && !i.spec.startsWith("./"));
    expect(bad).toEqual([]);
  });

  it("register modulov je čistý: neimportuje UI ani nič z aplikačnej vrstvy", () => {
    const bad = importsOf(join(SRC, "app")).filter((i) => i.file === "modules.ts" && i.spec.startsWith("."));
    expect(bad).toEqual([]);
  });
});
