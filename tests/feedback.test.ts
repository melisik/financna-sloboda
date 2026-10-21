import { describe, expect, it } from "vitest";
import { FEEDBACK_FORM_URL, feedbackIssueUrl } from "../src/app/feedback";

// Pripomienky od testerov (D-149). Odkazy nesmú niesť údaje z appky.
describe("pripomienky", () => {
  it("odkaz na GitHub je nové hlásenie so šablónou a bez údajov z appky", () => {
    const url = new URL(feedbackIssueUrl());
    expect(url.origin + url.pathname).toBe("https://github.com/melisik/financna-sloboda-app/issues/new");
    expect(url.searchParams.get("body")).toMatch(/Nepíšte čísla účtov/);
    expect(url.searchParams.get("body")).not.toMatch(/€|IBAN|zostatok/i);
  });

  it("formulár bez účtu je HTTPS odkaz na Google Forms", () => {
    expect(new URL(FEEDBACK_FORM_URL).hostname).toBe("docs.google.com");
    expect(FEEDBACK_FORM_URL.startsWith("https://")).toBe(true);
  });
});
