import type { CSSProperties } from "react";
import type { ObligationStatus } from "../../storage/types";

/** Stavy povinností (D-345): text, značka a vzhľad. Značka a text nesú význam aj bez farby. */

export const STATUS_LABEL: Record<ObligationStatus, string> = {
  caka: "čaká na úhradu",
  zaplatene: "zaplatené",
  po_splatnosti: "po splatnosti",
};

export const STATUS_MARK: Record<ObligationStatus, string> = {
  caka: "○",
  zaplatene: "✓",
  po_splatnosti: "!",
};

/** Farby z existujúcich premenných appky (svetlý aj tmavý režim). */
export const STATUS_STYLE: Record<ObligationStatus, CSSProperties> = {
  caka: { background: "var(--surface)", color: "var(--text)", border: "1px solid var(--border-strong)" },
  zaplatene: { background: "var(--ok-bg)", color: "var(--ok)", border: "1px solid var(--ok)" },
  po_splatnosti: { background: "var(--err-bg)", color: "var(--danger)", border: "1px solid var(--danger)", borderLeft: "4px solid var(--danger)", fontWeight: 600 },
};

export const STATUS_COLOR: Record<ObligationStatus, string> = {
  caka: "var(--text)",
  zaplatene: "var(--ok)",
  po_splatnosti: "var(--danger)",
};
