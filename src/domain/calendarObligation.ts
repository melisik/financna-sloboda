import type { BudgetCategory, CalendarObligation, RecurringExpense } from "./model/entities";
import { isRecurringActive } from "./recurring";

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Mesiac YYYY-MM z dátumu YYYY-MM-DD. */
export function toMonth(date: string): string {
  return date.slice(0, 7);
}

/** Prvý deň mesiaca YYYY-MM vo formáte YYYY-MM-DD. */
function firstDayOfMonth(month: string): string {
  return `${month}-01`;
}

/** Posledný deň mesiaca YYYY-MM vo formáte YYYY-MM-DD. */
function lastDayOfMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0));
  return `${y}-${String(m).padStart(2, "0")}-${String(last.getUTCDate()).padStart(2, "0")}`;
}

/** Dátum splatnosti: dayOfMonth v mesiaci, alebo posledný deň mesiaca ak dayOfMonth presahuje. */
function dueDateInMonth(month: string, dayOfMonth: number | undefined): string {
  if (!dayOfMonth) return lastDayOfMonth(month);
  const last = lastDayOfMonth(month);
  const lastDay = parseInt(last.slice(8), 10);
  const day = Math.min(dayOfMonth, lastDay);
  return `${month}-${String(day).padStart(2, "0")}`;
}

/** Ročný výdavok nastáva v mesiaci, keď bol startDate. */
function annualOccursInMonth(e: RecurringExpense, month: string): boolean {
  return e.startDate.slice(5, 7) === month.slice(5, 7);
}

/** Pravidelný výdavok je aktívny v danom mesiaci (prekrýva sa). */
function isActiveInMonth(e: RecurringExpense, month: string): boolean {
  const monthStart = firstDayOfMonth(month);
  const monthEnd = lastDayOfMonth(month);
  if (e.startDate > monthEnd) return false;
  if (e.endDate !== undefined && e.endDate < monthStart) return false;
  return true;
}

/**
 * Nájde existujúcu CalendarObligation pre daný recurringExpenseId + occurrenceMonth.
 * Vráti null ak neexistuje.
 */
export function findOccurrence(
  obligations: CalendarObligation[],
  recurringExpenseId: string,
  occurrenceMonth: string,
): CalendarObligation | null {
  return obligations.find(
    (o) => o.recurringExpenseId === recurringExpenseId && o.occurrenceMonth === occurrenceMonth,
  ) ?? null;
}

/**
 * Generuje virtuálne (neperzistované) povinnosti z pravidelných výdavkov pre daný mesiac.
 * Pre každý aktívny RecurringExpense skontroluje, či existuje persistovaný záznam;
 * ak áno, vráti existujúci; ak nie, vráti nový s id="virtual:<recurringExpenseId>:<month>".
 */
export function generateFromRecurring(
  items: RecurringExpense[],
  month: string,
  existing: CalendarObligation[],
): CalendarObligation[] {
  const result: CalendarObligation[] = [];
  for (const e of items) {
    if (!isActiveInMonth(e, month)) continue;
    if (e.frequency === "rocne" && !annualOccursInMonth(e, month)) continue;
    const found = findOccurrence(existing, e.id, month);
    if (found) {
      result.push(found);
    } else {
      result.push({
        id: `virtual:${e.id}:${month}`,
        recurringExpenseId: e.id,
        occurrenceMonth: month,
        name: e.name,
        category: e.category as BudgetCategory,
        amountCents: e.amountCents,
        dueDate: dueDateInMonth(month, e.dayOfMonth),
        status: "caka",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return result;
}

/** Jednorazové povinnosti (bez recurringExpenseId) pre daný mesiac. */
export function oneTimeForMonth(obligations: CalendarObligation[], month: string): CalendarObligation[] {
  return obligations.filter((o) => !o.recurringExpenseId && toMonth(o.dueDate) === month);
}

/**
 * Skontroluje, ktoré povinnosti prešli do stavu "po_splatnosti".
 * Vracia iba povinnosti, ktoré treba persistovane aktualizovať (status sa zmenil).
 */
export function findNewlyOverdue(
  obligations: CalendarObligation[],
  today: string,
): CalendarObligation[] {
  return obligations.filter(
    (o) => o.status === "caka" && o.dueDate < today && !o.id.startsWith("virtual:"),
  );
}

/**
 * Aplikuje stav "po_splatnosti" na povinnosti vo virtuálnom alebo reálnom zozname.
 * Virtualné (id začína "virtual:") sa nemenia v DB – len zobrazujú.
 */
export function resolveStatuses(
  obligations: CalendarObligation[],
  today: string,
): CalendarObligation[] {
  return obligations.map((o) => {
    if (o.status === "caka" && o.dueDate < today) {
      return { ...o, status: "po_splatnosti" as const };
    }
    return o;
  });
}

/** Súčet očakávaných (nezaplatených) platieb za mesiac. */
export function monthlyExpectedTotalCents(
  obligations: CalendarObligation[],
  month: string,
): number {
  return obligations
    .filter((o) => toMonth(o.dueDate) === month && (o.status === "caka" || o.status === "po_splatnosti"))
    .reduce((sum, o) => sum + o.amountCents, 0);
}

/** Súčet všetkých povinností za mesiac (vrátane zaplatených). */
export function monthlyTotalCents(obligations: CalendarObligation[], month: string): number {
  return obligations
    .filter((o) => toMonth(o.dueDate) === month)
    .reduce((sum, o) => sum + o.amountCents, 0);
}

/** Vytvorí novú jednorazovú povinnosť. */
export function newObligation(fields: {
  name: string;
  category: BudgetCategory;
  amountCents: number;
  dueDate: string;
  note?: string;
  variableSymbol?: string;
}): CalendarObligation {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: fields.name,
    category: fields.category,
    amountCents: fields.amountCents,
    dueDate: fields.dueDate,
    note: fields.note,
    variableSymbol: fields.variableSymbol,
    status: "caka",
    createdAt: now,
    updatedAt: now,
  };
}

/** Zoznam povinností pre mesiac (generované + jednorazové), zoradený podľa dueDate. */
export function obligationsForMonth(
  recurring: RecurringExpense[],
  existing: CalendarObligation[],
  month: string,
  today: string,
): CalendarObligation[] {
  const fromRecurring = generateFromRecurring(recurring, month, existing);
  const oneTime = oneTimeForMonth(existing, month);
  const all = [...fromRecurring, ...oneTime];
  const resolved = resolveStatuses(all, today);
  return resolved.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
