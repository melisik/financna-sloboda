import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FEEDBACK_FORM_URL, feedbackChannels, feedbackIssueUrl } from "../src/features/spatna-vazba/feedback";

// Pripomienky od testerov (D-149). Odkazy nesmú niesť údaje z appky.
describe("pripomienky", () => {
  it("odkaz na GitHub je nové hlásenie so šablónou a bez údajov z appky", () => {
    const url = new URL(feedbackIssueUrl());
    expect(url.origin + url.pathname).toBe("https://github.com/melisik/financna-sloboda-app/issues/new");
    expect(url.searchParams.get("body")).toMatch(/Nepíš čísla účtov/);
    expect(url.searchParams.get("body")).not.toMatch(/€|IBAN|zostatok/i);
  });

  it("formulár bez účtu je HTTPS odkaz na Google Forms", () => {
    expect(new URL(FEEDBACK_FORM_URL).hostname).toBe("docs.google.com");
    expect(FEEDBACK_FORM_URL.startsWith("https://")).toBe(true);
  });
});

// Súkromný náhľad (D-280): hlásenia na GitHube sú verejné, preto náhľad ponúka len formulár.
describe("pripomienky v náhľade", () => {
  it("verejná zostava ponúka GitHub aj formulár, náhľad len formulár", () => {
    expect(feedbackChannels(false)).toEqual(["github", "form"]);
    expect(feedbackChannels(true)).toEqual(["form"]);
  });

  it("príznak náhľadu nastavuje len workflow náhľadu, nie verejné nasadenie", () => {
    expect(readFileSync(".github/workflows/preview-phase2.yml", "utf8")).toContain('VITE_PREVIEW: "1"');
    expect(readFileSync(".github/workflows/pages.yml", "utf8")).not.toContain("VITE_PREVIEW");
  });
});

