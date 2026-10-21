import type { Property } from "../storage/types";

/** Plné mesiace od dátumu from do dátumu to (oba RRRR-MM-DD). Neskorší deň v mesiaci musí byť dosiahnutý. */
export function fullMonthsBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  let months = ty * 12 + tm - (fy * 12 + fm);
  if (td < fd) months -= 1;
  return Math.max(0, months);
}

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
  if (!balanceDate || balanceCents <= 0 || !paymentCents) return null;
  const months = fullMonthsBetween(balanceDate, today);
  if (months <= 0) return null;
  let balance = balanceCents;
  for (let i = 0; i < months && balance > 0; i++) {
    const interest = Math.round((balance * rate) / 12);
    balance -= paymentCents - interest;
  }
  return { balanceCents: Math.max(0, balance), balanceDate: addMonths(balanceDate, months) };
}

/** Automatické splácanie hypotéky (D-137). */
export function amortizeMortgage(p: Property, today: string): { mortgageBalanceCents: number; balanceDate: string } | null {
  if (!p.monthlyPaymentCents) return null;
  const r = amortizeLoan(p.mortgageBalanceCents, p.mortgageRate ?? 0, p.monthlyPaymentCents, p.balanceDate, today);
  return r ? { mortgageBalanceCents: r.balanceCents, balanceDate: r.balanceDate } : null;
}
