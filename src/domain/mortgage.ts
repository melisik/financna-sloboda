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
 * Automatické splácanie hypotéky (D-137): za každý uplynulý mesiac sa zostatok zníži o istinu
 * (splátka mínus úrok z aktuálneho zostatku). Bez dátumu zostatku alebo splátky sa nič nerobí.
 */
export function amortizeMortgage(p: Property, today: string): { mortgageBalanceCents: number; balanceDate: string } | null {
  if (!p.balanceDate || p.mortgageBalanceCents <= 0 || !p.monthlyPaymentCents) return null;
  const months = fullMonthsBetween(p.balanceDate, today);
  if (months <= 0) return null;
  const rate = p.mortgageRate ?? 0;
  let balance = p.mortgageBalanceCents;
  for (let i = 0; i < months && balance > 0; i++) {
    const interest = Math.round((balance * rate) / 12);
    balance -= p.monthlyPaymentCents - interest;
  }
  return { mortgageBalanceCents: Math.max(0, balance), balanceDate: addMonths(p.balanceDate, months) };
}
