import type { ExtraPaymentMode, MortgagePayment, Property } from "./model/entities";
import { fullMonthsBetween } from "./dates";

/** Pridá mesiace k dátumu; deň sa orezá na posledný deň cieľového mesiaca. */
export function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const total = y * 12 + (m - 1) + months;
  const ty = Math.floor(total / 12);
  const tm = total % 12;
  const lastDay = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${String(ty).padStart(4, "0")}-${String(tm + 1).padStart(2, "0")}-${String(Math.min(d, lastDay)).padStart(2, "0")}`;
}

/**
 * Automatické splácanie úveru (D-137, D-140): za každý uplynulý mesiac sa zostatok zníži o istinu
 * (splátka mínus úrok z aktuálneho zostatku). Bez dátumu zostatku alebo splátky sa nič nerobí.
 */
export function amortizeLoan(balanceCents: number, rate: number, paymentCents: number, balanceDate: string | undefined, today: string): { balanceCents: number; balanceDate: string } | null {
  const r = amortize(balanceCents, rate, paymentCents, balanceDate, today);
  return r ? { balanceCents: r.balanceCents, balanceDate: r.balanceDate } : null;
}

/** Spoločný výpočet splácania; zaplatená suma kroku je splátka, najviac zostatok s úrokom (posledná splátka, D-255, D-347). */
function amortize(balanceCents: number, rate: number, paymentCents: number, balanceDate: string | undefined, today: string): { balanceCents: number; balanceDate: string; lastPayment: MortgagePayment } | null {
  if (!balanceDate || balanceCents <= 0 || !paymentCents) return null;
  const months = fullMonthsBetween(balanceDate, today);
  if (months <= 0) return null;
  let balance = balanceCents;
  let lastPayment: MortgagePayment | null = null;
  for (let i = 0; i < months && balance > 0; i++) {
    const interest = Math.round((balance * rate) / 12);
    const paid = Math.min(paymentCents, balance + interest);
    balance = balance + interest - paid;
    lastPayment = { date: addMonths(balanceDate, i + 1), amountCents: paid, balanceAfterCents: balance };
  }
  return lastPayment && { balanceCents: balance, balanceDate: addMonths(balanceDate, months), lastPayment };
}

/**
 * Počet mesiacov, za ktoré sa zostatok pri danej splátke splatí. Null, ak splátka nepokryje úrok
 * (zostatok by nikdy neklesol) alebo nie je zadaná.
 */
export function remainingMonths(balanceCents: number, rate: number, paymentCents: number): number | null {
  if (balanceCents <= 0) return 0;
  if (paymentCents <= 0) return null;
  if (rate === 0) return Math.ceil(balanceCents / paymentCents);
  const r = rate / 12;
  if (paymentCents <= balanceCents * r) return null;
  return Math.ceil(-Math.log(1 - (r * balanceCents) / paymentCents) / Math.log(1 + r));
}

/** Splátka, ktorá splatí zostatok za presne n mesiacov (zaokrúhlená nahor na cent). */
export function paymentForMonths(balanceCents: number, rate: number, months: number): number {
  if (balanceCents <= 0) return 0;
  if (rate === 0) return Math.ceil(balanceCents / months);
  const r = rate / 12;
  return Math.ceil((balanceCents * r) / (1 - Math.pow(1 + r, -months)));
}

/**
 * Mimoriadna splátka hypotéky (N-15, D-145). Suma sa odpočíta od zostatku.
 * „znizit_splatku“: termín ostane, splátka sa prepočíta; „skratit_termin“: splátka ostane, termín sa skráti.
 * Vráti null, ak sa splátka nedá znížiť (nepokrýva úrok).
 */
export function applyExtraPayment(p: Pick<Property, "mortgageBalanceCents" | "mortgageRate" | "monthlyPaymentCents">, amountCents: number, mode: ExtraPaymentMode): { mortgageBalanceCents: number; monthlyPaymentCents: number; monthsBefore: number | null; monthsAfter: number | null } | null {
  const rate = p.mortgageRate ?? 0;
  const payment = p.monthlyPaymentCents ?? 0;
  const balance = Math.max(0, p.mortgageBalanceCents - amountCents);
  const monthsBefore = remainingMonths(p.mortgageBalanceCents, rate, payment);
  let newPayment = payment;
  if (mode === "znizit_splatku") {
    if (monthsBefore === null || monthsBefore === 0) return null;
    newPayment = Math.min(payment, paymentForMonths(balance, rate, monthsBefore));
  }
  return { mortgageBalanceCents: balance, monthlyPaymentCents: newPayment, monthsBefore, monthsAfter: remainingMonths(balance, rate, newPayment) };
}

/** Automatické splácanie hypotéky (D-137) so záznamom o poslednej zaplatenej splátke (D-347). */
export function amortizeMortgage(p: Property, today: string): { mortgageBalanceCents: number; balanceDate: string; lastMortgagePayment: MortgagePayment } | null {
  if (!p.monthlyPaymentCents) return null;
  const r = amortize(p.mortgageBalanceCents, p.mortgageRate ?? 0, p.monthlyPaymentCents, p.balanceDate, today);
  return r ? { mortgageBalanceCents: r.balanceCents, balanceDate: r.balanceDate, lastMortgagePayment: r.lastPayment } : null;
}

/**
 * Splátka, ktorá nepokryje úrok za jeden mesiac (alebo ho len vyrovná): zostatok nekleslie (nález 8).
 * Používa sa na upozornenie pri zápise záväzku.
 */
export function paymentBelowInterest(balanceCents: number, rate: number, paymentCents: number): boolean {
  return balanceCents > 0 && paymentCents > 0 && paymentCents <= (balanceCents * rate) / 12;
}
