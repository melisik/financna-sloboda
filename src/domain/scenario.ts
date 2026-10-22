import type { Capital } from "./capital";
import type { Ctx } from "./context";
import { goalMonths } from "./rentalGoal";
import { goalDisplay } from "./goalDisplay";
import { goalDateText } from "./goalText";

/**
 * Dátum cieľa pre danú mieru výnosu (FR-02, FR-03). Dnešný dátum a formátovanie mesiaca
 * dostane ako parameter, aby funkcia zostala čistá a dala sa testovať.
 */
export function scenarioDateText(
  ctx: Ctx,
  rate: number,
  today: string,
  formatDate: (iso: string) => string,
  capital: Capital = ctx.capital,
): string {
  if (!ctx.latest || ctx.target === null) return "—";
  const g = goalMonths(capital, ctx.mInv, ctx.mCash, rate, ctx.target, ctx.rentals);
  if (g.kind === "cash_exhausted") return `Hotovosť by sa vyčerpala v mesiaci ${g.month}; dátum sa nezobrazuje.`;
  const display = goalDisplay(g.kind === "months" ? g.months : null, ctx.latest.date, today);
  return goalDateText(display, ctx.mInv + ctx.mCash === 0, formatDate);
}
