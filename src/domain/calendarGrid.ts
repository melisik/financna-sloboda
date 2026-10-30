import type { CalendarObligation, ObligationStatus, RecurringExpense } from "./model/entities";
import { obligationsForMonth, toMonth } from "./calendarObligation";

/** Mesačná mriežka finančného kalendára (D-345): čisté dátumové pomôcky bez UI. Týždeň začína pondelkom. */

export interface GridDay {
  date: string; // YYYY-MM-DD
  inMonth: boolean; // patrí do zobrazeného mesiaca; inak ide o tlmený deň susedného mesiaca
  day: number; // 1–31
  weekday: number; // 0 = pondelok … 6 = nedeľa
}

const pad2 = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${String(y).padStart(4, "0")}-${pad2(m)}-${pad2(d)}`;

export const MONTHS_NOM = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
export const MONTHS_GEN = ["januára", "februára", "marca", "apríla", "mája", "júna", "júla", "augusta", "septembra", "októbra", "novembra", "decembra"];
export const WEEKDAYS_SHORT = ["Po", "Ut", "St", "Št", "Pi", "So", "Ne"];
export const WEEKDAYS_LONG = ["pondelok", "utorok", "streda", "štvrtok", "piatok", "sobota", "nedeľa"];

/** Platný mesiac YYYY-MM (roky 1900 až 2999; mimo nich by Date.UTC skreslil rok). */
export function isMonth(v: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(v)) return false;
  const y = Number(v.slice(0, 4));
  return y >= 1900 && y <= 2999;
}

export function daysInMonth(month: string): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** Deň v týždni: 0 = pondelok … 6 = nedeľa. */
export function weekdayIndex(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

/** Posun o `delta` mesiacov; prechod medzi rokmi je správny (2026-12 + 1 = 2027-01). */
export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const t = y * 12 + (m - 1) + delta;
  return `${String(Math.floor(t / 12)).padStart(4, "0")}-${pad2((t % 12) + 1)}`;
}

/** Týždne mesiaca: 4 až 6 riadkov po 7 dňoch, pondelok až nedeľa; dni susedných mesiacov majú inMonth = false. */
export function monthGrid(month: string): GridDay[][] {
  const first = `${month}-01`;
  const lead = weekdayIndex(first);
  const weeks = Math.ceil((lead + daysInMonth(month)) / 7);
  const start = addDays(first, -lead);
  const out: GridDay[][] = [];
  for (let w = 0; w < weeks; w++) {
    const row: GridDay[] = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, w * 7 + i);
      row.push({ date, inMonth: toMonth(date) === month, day: Number(date.slice(8, 10)), weekday: i });
    }
    out.push(row);
  }
  return out;
}

export function monthLabelSk(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return `${MONTHS_NOM[m - 1]} ${y}`;
}

/** „piatok 15. októbra 2026“. */
export function longDateSk(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return `${WEEKDAYS_LONG[weekdayIndex(date)]} ${d}. ${MONTHS_GEN[m - 1]} ${y}`;
}

/** Slovenské skloňovanie: 1 povinnosť, 2 až 4 povinnosti, inak povinností. */
export function obligationCountLabel(n: number): string {
  if (n === 1) return "povinnosť";
  if (n >= 2 && n <= 4) return "povinnosti";
  return "povinností";
}

/** Povinnosti všetkých mesiacov, ktoré mriežka zobrazuje (zobrazený mesiac a časti susedných). */
export function obligationsForGrid(
  recurring: RecurringExpense[],
  existing: CalendarObligation[],
  weeks: GridDay[][],
  today: string,
): CalendarObligation[] {
  const months = [...new Set(weeks.flat().map((d) => toMonth(d.date)))];
  return months.flatMap((m) => obligationsForMonth(recurring, existing, m, today));
}

export function groupByDate(list: CalendarObligation[]): Map<string, CalendarObligation[]> {
  const out = new Map<string, CalendarObligation[]>();
  for (const o of list) {
    const bucket = out.get(o.dueDate);
    if (bucket) bucket.push(o); else out.set(o.dueDate, [o]);
  }
  return out;
}

const STATUS_RANK: Record<ObligationStatus, number> = { po_splatnosti: 0, caka: 1, zaplatene: 2 };

/** Najdôležitejší stav dňa: po splatnosti, potom čaká, potom zaplatené; prázdny deň = null. */
export function dayStatus(list: CalendarObligation[]): ObligationStatus | null {
  if (list.length === 0) return null;
  return list.reduce<ObligationStatus>((worst, o) => (STATUS_RANK[o.status] < STATUS_RANK[worst] ? o.status : worst), list[0].status);
}

/** Predvolene vybraný deň: dnešok, ak je v zobrazenom mesiaci, inak prvý deň mesiaca s povinnosťou, inak nič. */
export function defaultSelectedDate(month: string, today: string, byDate: Map<string, CalendarObligation[]>): string | null {
  if (toMonth(today) === month) return today;
  const first = [...byDate.keys()].filter((d) => toMonth(d) === month).sort()[0];
  return first ?? null;
}
