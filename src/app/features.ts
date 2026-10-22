/**
 * Fáza 2 (D-094, D-125, D-142): zapína sa vo vývojovom serveri (npm run dev) alebo pri zostavení s VITE_PHASE2=1.
 * Verejné nasadenie (pages.yml) ju zapína od D-142. Bez príznaku zostava voliteľné moduly neponúka (D-162).
 */
export const PHASE2_ENABLED: boolean = import.meta.env.DEV || import.meta.env.VITE_PHASE2 === "1";
