import type { AppData } from "../storage/types";

/**
 * OPRAVA B: Spoločná validácia precondícií pre snapshot (manuálny aj automatický).
 * Vracia null ak je OK, inak chybovú správu.
 *
 * Potvrdený prázdny zoznam je platná nula: `false` a `undefined` znamenajú nepotvrdený stav.
 */
export function validateSnapshotPreconditions(
  data: AppData,
  invalidationError?: string | null
): string | null {
  // 1. Ak nastala chyba pri zneplatnení potvrdení (zmena majetku/záväzkov), STOP
  if (invalidationError) {
    return invalidationError;
  }

  // 2. Settings musia existovať
  if (!data?.settings) {
    return "Nastavenia nie sú dostupné";
  }

  // 3. KRITICKÉ: propertiesConfirmed MUSÍ BYŤ === true
  //    Bez ohľadu na počet nehnuteľností.
  //    Prázdna evidencia: musí byť potvrdená ("konfirmujem, že nie sú žiadne").
  //    1+ nehnuteľnosti: musí byť potvrdená ("konfirmujem, že všetky sú zaradené").
  if (data.settings.propertiesConfirmed !== true) {
    return "Nehnuteľnosti nie sú potvrdzené ako úplné";
  }

  // 4. KRITICKÉ: liabilitiesConfirmed MUSÍ BYŤ === true
  //    Rovnako — bez ohľadu na počet.
  if (data.settings.liabilitiesConfirmed !== true) {
    return "Záväzky nie sú potvrdzené ako úplné";
  }

  return null;  // ✓ OK — všetko je pripravené
}
