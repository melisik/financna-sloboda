import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Vertikálne pravidlo (D-162, docs/21): doména ani jadro nesmú závisieť od UI ani od stavu modulov.
const SRC = join(__dirname, "..", "src");

// Zachytí statický import, dynamický import("…") a import bez mena ("…") v celom priečinku vrátane podpriečinkov (A-14).
function importsOf(dir: string, prefix = ""): { file: string; spec: string }[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const rel = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return importsOf(join(dir, entry.name), `${rel}/`);
    if (!entry.name.endsWith(".ts")) return [];
    const text = readFileSync(join(dir, entry.name), "utf8");
    return [...text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["']([^"']+)["']/g)].map((m) => ({ file: rel, spec: m[1] }));
  });
}

describe("pravidlo závislostí (D-020, D-162)", () => {
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

  it("feature moduly neimportujú aplikačnú vrstvu, hlavný UI súbor ani iné features (D-174)", () => {
    const root = join(SRC, "features");
    const bad: { file: string; spec: string }[] = [];
    for (const feat of readdirSync(root)) {
      for (const f of readdirSync(join(root, feat)).filter((x) => /\.tsx?$/.test(x))) {
        const text = readFileSync(join(root, feat, f), "utf8");
        for (const m of text.matchAll(/from "([^"]+)"/g)) {
          const spec = m[1];
          // zakázané: aplikačná vrstva (src/app), hlavný UI súbor (App) a iné features
          if (spec.includes("/app/") || spec.endsWith("/App") || spec.includes("features/")) {
            bad.push({ file: `${feat}/${f}`, spec });
          }
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it("register modulov je čistý: neimportuje UI ani nič z aplikačnej vrstvy", () => {
    const bad = importsOf(join(SRC, "app")).filter((i) => i.file === "modules.ts" && i.spec.startsWith("."));
    expect(bad).toEqual([]);
  });
});

function allFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? allFiles(join(dir, e.name)) : [join(dir, e.name)]));
}

// Štruktúra podľa docs/23: D-172, D-175, D-176, D-177, D-178, D-179, D-180, D-181, D-182, D-183, D-184, D-185, D-186, D-187, D-188, D-189, D-191, D-192, D-194, D-195, D-196, D-197.
describe("štruktúra a názvy podľa rozhodnutí D-172 až D-197 a D-202", () => {
  it("každá sekcia má svoj priečinok vo features a vrstva UI má svoje súbory", () => {
    const paths = [
      "features/zamok", "features/sklad", "features/dane", "features/zavazky", "features/investicie", "features/prijmy",
      "features/rozpocet", "features/pravidelne", "features/majetok", "features/transakcie", "features/vyhodnotenie",
      "features/nastavenia", "features/prehlad", "features/rocny-prehlad", "features/doklady", "features/spatna-vazba",
      "ui/Sprievodca.tsx", "ui/Navigacia.tsx", "ui/Shell.tsx", "ui/useAutomaticUpdates.ts", "ui/Sekcie.tsx",
    ];
    expect(paths.filter((p) => !existsSync(join(SRC, p)))).toEqual([]);
  });

  it("názvy súborov sa nelíšia len veľkosťou písmen (Windows nerozlišuje, D-202)", () => {
    const names = allFiles(SRC).map((f) => f.toLowerCase());
    expect(names.filter((f, i) => names.indexOf(f) !== i)).toEqual([]);
  });
});
