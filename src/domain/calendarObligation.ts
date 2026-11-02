import type { BudgetCategory, CalendarObligation, RecurringExpense, Source, Transaction } from "./model/entities";

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

/** Chyba nekonzistentného prepojenia povinnosti a transakcie (D-342); operácia sa nevykoná. */
export class CalendarLinkError extends Error {}

const isVirtualId = (id: string) => id.startsWith("virtual:");

/** Predvyplnená poznámka transakcie vytvorenej z povinnosti. */
export function defaultPaymentNote(o: CalendarObligation): string {
  return o.name;
}

/** Transakcia (výdavok) vytvorená z povinnosti; väzba na povinnosť je uložená v `calendarObligationId`. */
export function buildPaymentTransaction(
  o: CalendarObligation,
  p: { date: string; amountCents: number; source: Source; note?: string },
  now: string = new Date().toISOString(),
): Transaction {
  const note = (p.note ?? defaultPaymentNote(o)).trim().slice(0, 200);
  return {
    id: uid(),
    date: p.date,
    type: "vydavok",
    amountCents: p.amountCents,
    source: p.source,
    category: o.category,
    ...(note ? { note } : {}),
    calendarObligationId: o.id,
    createdAt: now,
    updatedAt: now,
  };
}

/** Povinnosť označená ako zaplatená transakciou `t`. Virtuálna povinnosť dostane trvalé id. */
export function applyPayment(o: CalendarObligation, t: Transaction, paidDate: string, now: string = new Date().toISOString()): CalendarObligation {
  return { ...o, status: "zaplatene", paidDate, transactionId: t.id, updatedAt: now };
}

/**
 * Povinnosť po splatnosti, ak je v čase zápisu STÁLE „čaká" a termín už uplynul; inak null (nič sa nemení).
 * Rozhoduje sa nad aktuálnym záznamom v úložisku, nie nad starším snímkom z obrazovky.
 */
export function markOverdue(o: CalendarObligation, today: string, now: string = new Date().toISOString()): CalendarObligation | null {
  if (o.status !== "caka" || o.dueDate >= today || isVirtualId(o.id)) return null;
  return { ...o, status: "po_splatnosti", updatedAt: now };
}

/** Povinnosť vrátená do nezaplateného stavu: bez dátumu platby a bez odkazu na transakciu. */
export function clearPayment(o: CalendarObligation, now: string = new Date().toISOString()): CalendarObligation {
  const { paidDate: _p, transactionId: _t, ...rest } = o;
  return { ...rest, status: "caka", updatedAt: now };
}

/** Text problému, ak odkazy povinnosti a transakcie nesedia; null = prepojenie je konzistentné. */
export function linkProblem(o: CalendarObligation, t: Transaction | undefined): string | null {
  if (!o.transactionId) return "Povinnosť nemá prepojenú transakciu.";
  if (!t) return "Prepojená transakcia sa nenašla. Nič sa nezmenilo.";
  if (t.id !== o.transactionId || t.calendarObligationId !== o.id) return "Transakcia nie je prepojená s touto povinnosťou. Nič sa nezmenilo.";
  return null;
}

/**
 * Ošetrí odkaz `calendarObligationId` pri ukladaní transakcie (nová, úprava, vrátenie zmazania).
 * Povinnosť bez transakcie sa znovu prepojí; odkaz na neexistujúcu alebo inú povinnosť sa z transakcie odstráni,
 * aby nevznikol odkaz, ktorý by zálohu znemožnil obnoviť.
 */
export function reconcileTransactionLink(
  t: Transaction,
  o: CalendarObligation | undefined,
  now: string = new Date().toISOString(),
): { transaction: Transaction; obligation?: CalendarObligation } {
  if (!t.calendarObligationId) return { transaction: t };
  if (o && o.id === t.calendarObligationId && o.transactionId === t.id) return { transaction: t };
  if (o && o.id === t.calendarObligationId && !o.transactionId) {
    return { transaction: t, obligation: applyPayment(o, t, t.date, now) };
  }
  const { calendarObligationId: _c, ...rest } = t;
  return { transaction: rest };
}

/** Nezaplatené povinnosti s rovnakou sumou a splatnosťou ako ručne zapisovaná transakcia (len upozornenie). */
export function similarUnpaidObligations(obligations: CalendarObligation[], amountCents: number, date: string): CalendarObligation[] {
  return obligations.filter((o) => o.status !== "zaplatene" && !isVirtualId(o.id) && o.amountCents === amountCents && o.dueDate === date);
}

/** Chyby vzájomných odkazov povinností a transakcií pre validáciu zálohy. */
export function calendarLinkErrors(obligations: CalendarObligation[], transactions: Transaction[]): string[] {
  const errors: string[] = [];
  const txById = new Map(transactions.map((t) => [t.id, t]));
  const obById = new Map(obligations.map((o) => [o.id, o]));
  for (const o of obligations) {
    if (o.transactionId === undefined) continue;
    if (o.status !== "zaplatene") errors.push(`povinnosť „${o.name}": odkaz na transakciu má len zaplatená povinnosť`);
    const t = txById.get(o.transactionId);
    if (!t) errors.push(`povinnosť „${o.name}": odkazuje na transakciu, ktorá v zálohe nie je`);
    else if (t.calendarObligationId !== o.id) errors.push(`povinnosť „${o.name}": transakcia na ňu neodkazuje späť`);
  }
  for (const t of transactions) {
    if (t.calendarObligationId === undefined) continue;
    const o = obById.get(t.calendarObligationId);
    if (!o) errors.push(`transakcia ${t.id}: odkazuje na povinnosť, ktorá v zálohe nie je`);
    else if (o.transactionId !== t.id) errors.push(`transakcia ${t.id}: povinnosť na ňu neodkazuje späť`);
  }
  return errors;
}
