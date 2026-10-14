/**
 * Verzovaná tabuľka predpokladov výnosu (D-050, D-062, D-063, D-064, D-065).
 * Hodnoty sú predpoklady, nie údaje z trhu. Zdroj a dátum overenia sa menia len spolu s verziou.
 */
export const RETURN_ASSUMPTIONS = {
  version: 1,
  /** Reálny výnos investovaného kapitálu pred daňou a poplatkami (D-050). */
  realReturn: 0.035,
  /** Predpoklad inflácie pre nominálne zobrazenie (D-063) [predpoklad, zdroj treba overiť]. */
  inflation: 0.02,
  /** Stav overenia zdroja (RR29: zatiaľ neoverené). */
  status: "predpoklad" as const,
  verifiedOn: null as string | null,
  source: "review/o9-podklady.md (sekundárne zdroje, neoverené v primárnych dokumentoch)",
} as const;

/** Nominálny ekvivalent reálneho výnosu: (1 + r)(1 + π) − 1 (D-063). */
export function nominalFromReal(real: number, inflation: number): number {
  return (1 + real) * (1 + inflation) - 1;
}

/** Čistý reálny výnos po odpočítaní poplatkov, nie záporný (D-064). */
export function netRealReturn(real: number, feesRate = 0): number {
  return Math.max(0, real - feesRate);
}

/** Dlhý horizont pre poznámku v prehľade: viac ako 20 rokov (D-065). */
export const LONG_HORIZON_MONTHS = 240;
