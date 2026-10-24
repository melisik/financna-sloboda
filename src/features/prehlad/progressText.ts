import type { GoalDateShift, GoalProgress } from "../../domain/progress";
import { plural } from "../../domain/impact";
import { dateSk, eur } from "../../ui/kit/format";

/** Suma, ktorá sa nezalomí pred „€“ (tisíce oddeľuje nezalomiteľná medzera už `toLocaleString`). */
const eurKeep = (c: number) => eur(c).replace(/ €$/, "\u00a0€");

/** Riadok pokroku na Prehľade (D-283): vecne, bez hodnotenia (docs/03, zásada 2). */
export function progressLine(p: GoalProgress): string {
  return `Pokrok: ${p.percent}\u00a0% (${eurKeep(p.haveCents)} z ${eurKeep(p.targetCents)})`;
}

/** Posun dátumu cieľa od predchádzajúceho vyhodnotenia (D-283). */
export function shiftLine(s: GoalDateShift): string {
  const since = `Od vyhodnotenia ${dateSk(s.since)} sa dátum cieľa`;
  if (s.months === 0) return `${since} nezmenil.`;
  const n = Math.abs(s.months);
  return `${since} posunul o ${n} ${plural(n, "mesiac", "mesiace", "mesiacov")} ${s.months > 0 ? "bližšie" : "ďalej"}.`;
}
