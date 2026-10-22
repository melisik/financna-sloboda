import type { IncomeKind, RegularIncome } from "../storage/types";

/** Druhy príjmov vo výhľade (docs/14): dôchodky a dávky, ktoré používateľ zadá ručne. */
export const OUTLOOK_KINDS: readonly IncomeKind[] = ["starobny_dochodok", "invalidny_dochodok", "socialna_davka"];

/**
 * Budúce dôchodky a dávky (dátum začiatku je po dnešku), od najskoršieho. Len zobrazenie zadaných údajov:
 * nič sa nepočíta, neodhaduje a nemení dátum cieľa (D-154).
 */
export function futureOutlook(list: RegularIncome[], today: string): RegularIncome[] {
  return list
    .filter((i) => OUTLOOK_KINDS.includes(i.kind) && i.startDate > today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}
