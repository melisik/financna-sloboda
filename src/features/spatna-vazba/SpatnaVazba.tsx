import { useState } from "react";
import { btn } from "../../ui/kit/controls";
import { FEEDBACK_FORM_URL, feedbackChannels, feedbackIssueUrl } from "./feedback";

/** Nahlásenie pripomienky (D-149): tester si vyberie GitHub, alebo formulár bez účtu. V súkromnom náhľade len formulár (D-280). */
export function FeedbackBlock({ preview }: { preview: boolean }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button onClick={() => setOpen(true)} style={{ ...btn, marginTop: 16 }}>Nahlásiť pripomienku</button>;
  const onlyForm = !feedbackChannels(preview).includes("github");
  return (
    <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
      {onlyForm ? (
        <>
          <p>Pripomienku pošli cez formulár; odpovede nie sú verejné. Nepíš čísla účtov ani osobné údaje.</p>
          <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" style={btn}>Otvoriť formulár</a>{" "}
        </>
      ) : (
        <>
          <p>Vyber, ako pripomienku pošleš. Nepíš čísla účtov ani osobné údaje.</p>
          <a href={feedbackIssueUrl()} target="_blank" rel="noopener noreferrer" style={btn}>Mám účet na GitHube</a>{" "}
          <a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer" style={btn}>Nemám účet</a>{" "}
        </>
      )}
      <button onClick={() => setOpen(false)} style={btn}>Zrušiť</button>
    </div>
  );
}
