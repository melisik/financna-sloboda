import type { GoalShare, InvestmentGoal, Position } from "./model/entities";
import { fullMonthsBetween } from "./dates";

/** Hodnota položky v centoch: počet × cena × kurz k euru (D-101). */
export function positionValueCents(p: Position): number {
  return Math.round(p.quantity * p.unitPrice * p.fxToEur * 100);
}

/** Súčet mesačných vkladov do tretieho piliera a iných položiek v centoch. Len na zobrazenie (D-105). */
export function monthlyContributionsTotalCents(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + (p.monthlyContributionCents ?? 0), 0);
}

/** Súčet všetkých položiek v centoch. Vyhodnotenie ho použije ako investície (D-101). */
export function investmentsTotalCents(positions: Position[]): number {
  return positions.reduce((sum, p) => sum + positionValueCents(p), 0);
}

/** Súčet hodnoty v centoch podľa druhu položky (rozpis pri súhrne investícií). */
export function investmentsByKindCents(positions: Position[]): Partial<Record<Position["kind"], number>> {
  const out: Partial<Record<Position["kind"], number>> = {};
  for (const p of positions) out[p.kind] = (out[p.kind] ?? 0) + positionValueCents(p);
  return out;
}

/** Zmenila sa položka po danom čase? Upozornenie pri vyhodnotení, lebo suma investícií sa z nej odvodzuje (D-101). */
export function positionsChangedSince(positions: Position[], isoTime: string): boolean {
  return positions.some((p) => p.updatedAt > isoTime);
}

/** Názvy položiek, ktorých ocenenie je staršie ako daný počet mesiacov (N-16, schválené 3 mesiace). */
export function staleValuationNames(positions: Position[], today: string, months = 3): string[] {
  return positions.filter((p) => fullMonthsBetween(p.valueDate, today) >= months).map((p) => p.name);
}

/** Skupina položiek podľa cieľa (D-105). Cieľ null = položky bez cieľa alebo s cieľom, ktorý neexistuje. Len zobrazenie. */
export interface GoalGroup {
  goal: InvestmentGoal | null;
  positions: Position[];
  /** Časti položiek v skupine: podiel v % a hodnota (D-334). */
  parts: { position: Position; percent: number; cents: number }[];
  /** Suma, ktorá cieľ prevyšuje a presunula sa inam (D-336). */
  overflowOutCents?: number;
  /** Suma presunutá sem z preplnených cieľov (D-336): cieľ zvyšku alebo „bez cieľa“. */
  overflowInCents?: number;
  totalCents: number;
}

/** Podiely položky v cieľoch; staré `goalId` sa číta ako 100 % (D-334). */
export function positionShares(p: Position): GoalShare[] {
  if (p.goalShares) return p.goalShares;
  return p.goalId ? [{ goalId: p.goalId, percent: 100 }] : [];
}

/** Prevedie staré `goalId` na `goalShares` (záloha v15 a staršie, D-334). */
export function normalizePosition(p: Position): Position {
  if (p.goalId === undefined) return p;
  const { goalId, ...rest } = p;
  return p.goalShares ? rest : { ...rest, goalShares: [{ goalId, percent: 100 }] };
}

/** Časť hodnoty položky pre podiel: zaokrúhlené nadol, aby súčet cieľov nikdy neprekročil hodnotu položky (D-334). */
export const shareCents = (p: Position, percent: number): number => Math.floor((positionValueCents(p) * percent) / 100);

/**
 * Zoskupí položky podľa cieľov v poradí, v akom sú ciele; položka rozdelená na viac cieľov je v každom svojom cieli
 * s podielom. Skupina bez cieľa je nepriradený zvyšok (aj podiel na zmazaný cieľ) a vznikne, len ak nejaký je (D-105, D-334).
 * Súčet všetkých skupín je vždy celá hodnota investícií.
 */
export function groupByGoal(positions: Position[], goals: InvestmentGoal[]): GoalGroup[] {
  const known = new Set(goals.map((g) => g.id));
  const restGoal = goals.find((g) => g.receivesRest === true);
  const restOf = (position: Position) => {
    const assigned = positionShares(position).filter((s) => known.has(s.goalId));
    return {
      cents: positionValueCents(position) - assigned.reduce((sum, s) => sum + shareCents(position, s.percent), 0),
      percent: 100 - assigned.reduce((sum, s) => sum + s.percent, 0),
    };
  };
  let overflowTotal = 0;
  const groups: GoalGroup[] = goals.map((goal) => {
    const parts = positions.flatMap((position) => {
      const s = positionShares(position).find((x) => x.goalId === goal.id);
      // Cieľ zvyšku (D-335) dostane aj nepriradenú časť každej položky.
      const r = goal.id === restGoal?.id ? restOf(position) : { cents: 0, percent: 0 };
      if (!s && r.cents <= 0) return [];
      return [{ position, percent: (s?.percent ?? 0) + r.percent, cents: (s ? shareCents(position, s.percent) : 0) + r.cents }];
    });
    const allocated = parts.reduce((sum, x) => sum + x.cents, 0);
    // Cieľ sa neplní nad cieľovú sumu (D-336): suma navyše sa presunie do cieľa zvyšku (alebo do „bez cieľa“).
    const over = goal.id !== restGoal?.id && allocated > goal.targetCents ? allocated - goal.targetCents : 0;
    overflowTotal += over;
    const scaled = over > 0 ? parts.map((x) => ({ ...x, cents: Math.floor((x.cents * goal.targetCents) / allocated) })) : parts;
    return { goal, positions: parts.map((x) => x.position), parts: scaled, totalCents: allocated - over, ...(over > 0 ? { overflowOutCents: over } : {}) };
  });
  if (restGoal) {
    const g = groups.find((x) => x.goal?.id === restGoal.id)!;
    if (overflowTotal > 0) { g.totalCents += overflowTotal; g.overflowInCents = overflowTotal; }
    return groups;
  }
  const rest = positions.flatMap((position) => {
    const r = restOf(position);
    return r.cents > 0 ? [{ position, percent: r.percent, cents: r.cents }] : [];
  });
  const restTotal = rest.reduce((sum, x) => sum + x.cents, 0) + overflowTotal;
  if (rest.length > 0 || overflowTotal > 0) groups.push({ goal: null, positions: rest.map((x) => x.position), parts: rest, totalCents: restTotal, ...(overflowTotal > 0 ? { overflowInCents: overflowTotal } : {}) });
  return groups;
}

/** Pokrok skupiny k cieľovej sume: percento 0 až 100 a či je cieľ dosiahnutý (D-105). Nad cieľom sa zobrazí 100 %. */
export function goalProgress(totalCents: number, targetCents: number): { percent: number; reached: boolean } {
  const reached = totalCents >= targetCents;
  const percent = reached ? 100 : Math.max(0, Math.floor((totalCents / targetCents) * 100));
  return { percent, reached };
}

export interface GoalSummary { id: string; name: string; totalCents: number; targetCents: number; percent: number; reached: boolean; count: number; overflowOutCents?: number; overflowInCents?: number }

/** Pokrok každého cieľa investícií pre Prehľad (D-331); len zobrazenie, výpočet dátumu cieľa sa nemení (D-258). */
export function goalSummaries(positions: Position[], goals: InvestmentGoal[]): GoalSummary[] {
  return groupByGoal(positions, goals).flatMap((g) => {
    if (!g.goal) return [];
    const { percent, reached } = goalProgress(g.totalCents, g.goal.targetCents);
    return [{ id: g.goal.id, name: g.goal.name, totalCents: g.totalCents, targetCents: g.goal.targetCents, percent, reached, count: g.positions.length, ...(g.overflowOutCents ? { overflowOutCents: g.overflowOutCents } : {}), ...(g.overflowInCents ? { overflowInCents: g.overflowInCents } : {}) }];
  });
}

/**
 * Nastaví podiel cieľa `goalId` pri položkách (`percents`: id položky → celé percento 0 až 100; 0 = odobrať).
 * Vráti len zmenené položky v novom tvare (goalShares). Chyba, ak súčet podielov položky prekročí 100 % alebo je percento neplatné;
 * vtedy sa nič nevráti (D-334).
 */
export function applyGoalShares(positions: Position[], goalId: string, percents: Record<string, number>, nowIso: string): { changed: Position[]; error?: string } {
  const changed: Position[] = [];
  for (const p of positions) {
    if (!(p.id in percents)) continue;
    const percent = percents[p.id];
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) return { changed: [], error: `Podiel pri položke „${p.name}“ musí byť celé percento od 0 do 100.` };
    const others = positionShares(p).filter((s) => s.goalId !== goalId);
    const next = percent > 0 ? [...others, { goalId, percent }] : others;
    if (next.reduce((sum, s) => sum + s.percent, 0) > 100) return { changed: [], error: `Súčet podielov položky „${p.name}“ v cieľoch je nad 100 %.` };
    const before = positionShares(p).find((s) => s.goalId === goalId)?.percent ?? 0;
    if (before === percent) continue;
    const { goalId: _legacy, goalShares: _old, ...rest } = p;
    changed.push({ ...rest, ...(next.length > 0 ? { goalShares: next } : {}), updatedAt: nowIso });
  }
  return { changed };
}
