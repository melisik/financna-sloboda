// Vytvorí src/data/nbsProviders.json z registra subjektov finančného trhu NBS (D-329, docs/63, docs/64).
// Spúšťa sa ručne raz za kvartál: node --experimental-strip-types scripts/nbs-providers.mts [cesta k stiahnutému ZIP exportu]
// Bez argumentu stiahne https://subjekty.nbs.sk/api/json. Appka register nevolá (D-009); zdroj a dátum sa ukážu v UI.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectProviders, type NbsInstitution } from "../src/domain/nbsProviders.ts";

const URL_EXPORT = "https://subjekty.nbs.sk/api/json";
const dir = mkdtempSync(join(tmpdir(), "nbs-"));
let zipPath = process.argv[2];
if (!zipPath) {
  const res = await fetch(URL_EXPORT);
  if (!res.ok) throw new Error(`Export NBS: HTTP ${res.status}`);
  zipPath = join(dir, "export.zip");
  writeFileSync(zipPath, Buffer.from(await res.arrayBuffer()));
}
const json = execFileSync("unzip", ["-p", zipPath], { maxBuffer: 256 * 1024 * 1024 }).toString("utf8");
const data = JSON.parse(json) as { updated: string; institutions: NbsInstitution[] };
const providers = selectProviders(data.institutions);
const out = {
  source: "Register subjektov finančného trhu, Národná banka Slovenska (subjekty.nbs.sk)",
  updated: data.updated,
  providers,
};
writeFileSync(new URL("../src/data/nbsProviders.json", import.meta.url), JSON.stringify(out, null, 1) + "\n", "utf8");
console.log(`Stav registra ${data.updated}: ${data.institutions.length} subjektov, do zoznamu ${providers.length}.`);
