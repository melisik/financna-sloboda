import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { btnLink, calloutStyle, card, hintStyle } from "../src/ui/kit/controls";

// Jednotný vizuálny štýl (docs/39, D-278). Tokeny musia byť v svetlom aj v oboch tmavých režimoch.
const html = readFileSync("index.html", "utf8");
const lightBlock = html.slice(html.indexOf(":root {"), html.indexOf("}", html.indexOf(":root {")));
const darkMedia = html.slice(html.indexOf('@media (prefers-color-scheme: dark)'));
const darkData = html.slice(html.indexOf(':root[data-theme="dark"]'));

describe("vizuálne tokeny (docs/39)", () => {
  it("farby zamerania a odkazov sú v svetlom aj v oboch tmavých režimoch", () => {
    for (const name of ["--focus", "--link", "--warn-border"]) {
      expect(lightBlock).toContain(`${name}:`);
      expect(darkMedia).toContain(`${name}:`);
      expect(darkData).toContain(`${name}:`);
    }
  });

  it("typografické tokeny sú definované jednotne", () => {
    expect(lightBlock).toContain("--font-text: 1rem");
    expect(lightBlock).toContain("--font-small: 0.9rem");
    expect(lightBlock).toContain("--font-heading: 1.25rem");
    expect(lightBlock).toContain("--font-title: 1.5rem");
  });

  it("viditeľný okraj pri klávesnici je v štýloch", () => {
    expect(html).toContain(":focus-visible");
  });

  it("textové odkazy majú jednotnú farbu z tokenu", () => {
    expect(html).toContain("a { color: var(--link); }");
  });

  it("pomocný odkaz nemá rámik a má dotykovú výšku aspoň 44 px", () => {
    expect(btnLink.border).toBe("none");
    expect(btnLink.minHeight).toBe(44);
  });

  it("upozornenie má ľavý okraj farbou tónu a text v hlavnej farbe", () => {
    expect(calloutStyle("warn").borderLeft).toContain("var(--warn-border)");
    expect(calloutStyle("error").borderLeft).toContain("var(--danger)");
    expect(calloutStyle("warn").color).toBe("var(--text)");
  });

  it("karta a pomocný text sú pripravené", () => {
    expect(card.border).toBe("1px solid var(--border)");
    expect(hintStyle.fontSize).toBe("var(--font-small)");
  });
});
