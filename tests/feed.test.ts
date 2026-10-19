import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parseFeed } from "../src/storage/feed";

// D-112: súbor od integračnej služby sa len číta a kontroluje; syntetické údaje.
const fixture = () => JSON.parse(readFileSync(path.resolve("tests/fixtures/integracia-syntetika.json"), "utf8"));

describe("súbor od integračnej služby (D-112)", () => {
  it("platný súbor sa prevedie na príjmy so zdrojom a dátumom získania", () => {
    const check = parseFeed(fixture());
    expect(check.ok).toBe(true);
    if (!check.ok) return;
    expect(check.feed.items).toHaveLength(2);
    expect(check.feed.items[0].source).toBe("Integračná služba (syntetické)");
    expect(check.feed.items[0].id).toBe("ext:Integračná služba (syntetické):d1");
    expect(check.feed.items[0].fetchedAt).toBe("2026-10-19T08:00:00Z");
  });

  it("súbor z inej aplikácie, neznáme pole alebo zlý druh sa odmietne", () => {
    expect(parseFeed({ ...fixture(), app: "iná" }).ok).toBe(false);
    expect(parseFeed({ ...fixture(), extra: 1 }).ok).toBe(false);
    const bad = fixture();
    bad.items[0].kind = "krypto";
    const check = parseFeed(bad);
    expect(check.ok).toBe(false);
    if (!check.ok) expect(check.errors.join(" ")).toMatch(/druh musí byť/);
  });

  it("neznáma verzia formátu a chýbajúci dátum získania sa odmietnu", () => {
    expect(parseFeed({ ...fixture(), feedVersion: 2 }).ok).toBe(false);
    expect(parseFeed({ ...fixture(), fetchedAt: "nie je dátum" }).ok).toBe(false);
  });
});
