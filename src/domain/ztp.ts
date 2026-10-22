/**
 * Model ZŤP: držiteľ preukazu fyzickej osoby s ťažkým zdravotným postihnutím (tlačivo 17-dp-md, oddiel I a V).
 * Zatiaľ len objekt bez náplne (box). Nepoužíva sa v UI ani v zálohe; náplň sa doplní po rozhodnutí o potrebe údajov.
 */
export interface ZtpModel {
  /** Príznak, že objekt je zatiaľ prázdny placeholder. */
  readonly placeholder: true;
}

export function createZtpModel(): ZtpModel {
  return { placeholder: true };
}
