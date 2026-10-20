import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// R17: CSP je len meta tag (GitHub Pages nevie hlavičky). Skripty nesmú byť inline.
const html = readFileSync(resolve(__dirname, "..", "index.html"), "utf8");
const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? "";
const scriptSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("script-src")) ?? "";

describe("Content Security Policy (R17, 05 §7)", () => {
  it("meta tag CSP existuje", () => {
    expect(csp).not.toBe("");
  });
  it("script-src neobsahuje unsafe-inline ani unsafe-eval; povolený je len wasm (OCR skenera, offline)", () => {
    expect(scriptSrc).toBe("script-src 'self' 'wasm-unsafe-eval'");
  });
  it("default-src je len 'self'", () => {
    expect(csp).toMatch(/default-src 'self'/);
  });
});
