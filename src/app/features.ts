/**
 * Fáza 2 (D-094, D-125, D-142): zapína sa vo vývojovom serveri (npm run dev) alebo pri zostavení s VITE_PHASE2=1.
 * Verejné nasadenie (pages.yml) ju zapína od D-142. Bez príznaku zostava voliteľné moduly neponúka (D-162).
 */
export const PHASE2_ENABLED: boolean = import.meta.env.DEV || import.meta.env.VITE_PHASE2 === "1";

/** Súkromný náhľad (D-270, D-280): nastavuje ho len workflow preview-phase2 (VITE_PREVIEW=1). E2E aj verejná zostava ho nemajú. */
export const PREVIEW_BUILD: boolean = import.meta.env.VITE_PREVIEW === "1";
