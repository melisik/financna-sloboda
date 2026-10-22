import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Šablóna priznania typu rdp=1, rok 2025 (D-220): okrem pevných hodnôt nesmie obsahovať žiadne údaje daňovníka.
const xml = readFileSync("public/tlaciva/dpfo-rdp1-2025-sablona.xml", "utf-8");

const ALLOWED: [string, string][] = [
  ["rdp", "1"],
  ["odp", "0"],
  ["ddp", "0"],
  ["rok", "2025"],
  ["k1", "68"],
  ["k2", "20"],
  ["k3", "0"],
  ["cinnost", "Prenájom a prevádzkovanie vlastných alebo prenajatých nehnuteľností"],
  ["rok", "2020"],
  ["rok", "2021"],
  ["rok", "2022"],
  ["rok", "2023"],
  ["rok", "2024"],
];

describe("šablóna XML priznania rdp=1, rok 2025 (D-220)", () => {
  it("má len pevné hodnoty typu, roka a názvov rokov", () => {
    const filled = [...xml.matchAll(/<([A-Za-z0-9]+)>([^<]+)<\/\1>/g)].map((m) => [m[1], m[2]]);
    expect(filled).toEqual(ALLOWED);
  });

  it("je celý dokument v koreňovom elemente dokument", () => {
    expect(xml.trimStart().startsWith("<?xml")).toBe(true);
    expect(xml.trimEnd().endsWith("</dokument>")).toBe(true);
  });
});
