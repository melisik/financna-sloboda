/** Pruh „Skúšobná verzia“ (D-144, D-281, docs/42): text a voľba zbalenia uložená len v tomto zariadení. */

export const TRIAL_SUMMARY = "Skúšobná verzia: údaje sú len v tomto zariadení, ukladaj si zálohu.";

export const TRIAL_DETAILS =
  "Údaje nie sú zašifrované a môžu sa stratiť. Appka sa poskytuje bez záruky a nie je finančné poradenstvo. " +
  "Fáza 2 zatiaľ nie je právne posúdená ani bezpečnostne auditovaná. Výpočet je pred daňou; poplatky sa odpočítajú od výnosu, ak ich zadáš.";

/** Kľúč nesie verziu textu: pri podstatnej zmene obsahu sa zvýši a pruh sa na každom zariadení znova rozbalí. */
export const TRIAL_COLLAPSED_KEY = "fs-trial-note-collapsed-v1";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Úložisko prehliadača; v niektorých režimoch už samotný prístup vyhodí chybu. */
export function deviceStore(): Store | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

/** Bez uloženej voľby (prvé otvorenie, nedostupné úložisko) je pruh rozbalený. */
export function readTrialCollapsed(store: Store | undefined): boolean {
  try {
    return store?.getItem(TRIAL_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveTrialCollapsed(store: Store | undefined, collapsed: boolean): void {
  try {
    if (collapsed) store?.setItem(TRIAL_COLLAPSED_KEY, "1");
    else store?.removeItem(TRIAL_COLLAPSED_KEY);
  } catch {
    // Bez úložiska sa voľba nezapamätá; pruh sa pri ďalšom otvorení ukáže rozbalený.
  }
}
