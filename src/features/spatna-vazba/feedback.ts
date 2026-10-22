/**
 * Pripomienky od testerov (D-149). Appka nič neposiela sama; odkazy otvárajú externú stránku,
 * kde tester píše vlastnými slovami. Do odkazu sa nepridáva žiadny údaj z appky.
 */
export const FEEDBACK_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSe-B55hKFYonv57WlNjwZ7D8NWvPVb4ZMvQPHML_VebdmDn0Q/viewform";
const FEEDBACK_ISSUE_URL = "https://github.com/melisik/financna-sloboda-app/issues/new";

const ISSUE_BODY = "Sekcia appky:\n\nČo sa stalo:\n\nČo ste čakali:\n\n(Nepíšte čísla účtov ani osobné údaje.)";

/** Odkaz na nové hlásenie na GitHube so šablónou (bez údajov z appky). */
export function feedbackIssueUrl(): string {
  return `${FEEDBACK_ISSUE_URL}?title=${encodeURIComponent("Pripomienka: ")}&body=${encodeURIComponent(ISSUE_BODY)}`;
}
