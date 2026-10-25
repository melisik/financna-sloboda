import { useEffect, useState, type ReactNode } from "react";
import { btn } from "./controls";

/**
 * Zbalený blok formulára s jedným zdrojom stavu otvorenia (D-310, D-311): súhrn v nadpise, sám sa otvorí,
 * keď dostane obsah alebo chybu (`open`), a dá sa zbaliť. `reopenOn` (text chyby) ho otvorí znova pri každej novej chybe,
 * aj keď ho používateľ medzitým zbalil (revízia 2026-10-25c, N-3).
 */
export function FoldBlock({ title, summary, openWhen, reopenOn, children }: { title: string; summary?: string; openWhen: boolean; reopenOn?: string | null; children: ReactNode }) {
  const [open, setOpen] = useState(openWhen);
  useEffect(() => { if (openWhen) setOpen(true); }, [openWhen, reopenOn]);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} style={{ margin: "8px 0" }}>
      <summary style={{ ...btn, marginTop: 0, listStyle: "none" }}>{title}{summary ? ` · ${summary}` : ""} ▾</summary>
      <div style={{ fontSize: "var(--font-small)" }}>{children}</div>
    </details>
  );
}

