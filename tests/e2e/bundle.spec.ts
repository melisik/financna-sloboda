import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Prvé načítanie (D-284, docs/43 C1): knižnica skenera čiarových kódov nie je v hlavnom balíku; načíta sa až v Sklade.
// Kontroluje zostavu dist-test, ktorú pred testami vytvorí webServer v playwright.config.ts.
test("hlavný balík appky neobsahuje knižnicu skenera @zxing/library", () => {
  const html = readFileSync("dist-test/index.html", "utf8");
  const entry = html.match(/src="\.\/(assets\/index-[^"]+\.js)"/)?.[1];
  expect(entry).toBeTruthy();
  // ChecksumException je trieda vnútri knižnice (názvy, ktoré používa náš kód, napr. BrowserMultiFormatReader, ostávajú v hlavnom balíku).
  // Len áno/nie: pri chybe sa nevypisuje celý balík.
  expect(readFileSync(`dist-test/${entry}`, "utf8").includes("ChecksumException"), `${entry} obsahuje @zxing/library`).toBe(false);
});
