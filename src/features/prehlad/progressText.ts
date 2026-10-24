import type { GoalDateShift, GoalProgress } from "../../domain/progress";
import type { HistoryShift } from "../../domain/progressHistory";
import type { GoalDisplay } from "../../domain/goalDisplay";
import { plural } from "../../domain/impact";
import { dateSk, eurKeep } from "../../ui/kit/format";

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

/** Mesiac a rok ako MM/RRRR: v texte nezáleží na páde (D-289). */
const monthNum = (iso: string) => {
  const [y, m] = iso.split("-");
  return `${m}/${y}`;
};

/** Veta pod grafom vývoja: posun dátumu cieľa od prvého vyhodnotenia (D-289, docs/44). */
export function historyLine(s: HistoryShift): string {
  const since = `Od vyhodnotenia ${dateSk(s.since)} sa dátum cieľa`;
  if (s.months === 0) return `${since} nezmenil (${monthNum(s.to)}).`;
  const n = Math.abs(s.months);
  return `${since} posunul o ${n} ${plural(n, "mesiac", "mesiace", "mesiacov")} ${s.months > 0 ? "bližšie" : "ďalej"} (z ${monthNum(s.from)} na ${monthNum(s.to)}).`;
}

/** Dátum cieľa v tabuľke vývoja. */
export function goalCell(g: GoalDisplay | null): string {
  if (g === null) return "—";
  if (g.kind === "date" || g.kind === "stale") return monthNum(g.date);
  if (g.kind === "reached") return "dosiahnutý";
  if (g.kind === "over50") return "viac ako 50 rokov";
  return "nedosiahnuteľný";
}

