/**
 * Fáza 2 (D-094, D-125, D-142): zapína sa vo vývojovom serveri (npm run dev) alebo pri zostavení s VITE_PHASE2=1.
 * Verejné nasadenie (pages.yml) ju zapína od D-142. Bez príznaku zostava Fázu 2 nezobrazí.
 */
export const PHASE2_ENABLED: boolean = import.meta.env.DEV || import.meta.env.VITE_PHASE2 === "1";

/** Sekcie Fázy 2 (nie sú v MVP). */
export const PHASE2_SECTION_IDS = [
  "majetok",
  "zavazky",
  "investicie",
  "prijmy",
  "rozpocet",
  "pravidelne-vydavky",
  "dane",
  "sklad",
  "rocny-prehlad",
] as const;

export function isPhase2Section(id: string): boolean {
  return (PHASE2_SECTION_IDS as readonly string[]).includes(id);
}

/** Sekcie viditeľné v navigácii: pri vypnutej Fáze 2 sa Fázy 2 vynechajú. */
export function visibleSections<T extends { id: string }>(all: T[], phase2Enabled: boolean): T[] {
  return phase2Enabled ? all : all.filter((n) => !isPhase2Section(n.id));
}
