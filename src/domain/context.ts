import type { AppData, Settings, Snapshot } from "./model/entities";
import type { Capital } from "./capital";
import { targetAmountCents } from "./goal";
import { monthlySaving } from "./saving";
import { LONG_HORIZON_MONTHS, netRealReturn, RETURN_ASSUMPTIONS } from "./assumptions";
import { goalMonths, rentalsFor, type Rental } from "./rentalGoal";
import { capitalWithFlags, reserveBalance } from "./ledger";

/** Kontext prehľadu: stav kapitálu, cieľ a nastavenia z dát (FR-02, FR-04, D-121). Čistý výpočet, bez UI. */
export interface Ctx {
  settings: Settings | null;
  latest: Snapshot | null;
  capital: Capital;
  negative: { inv: boolean; cash: boolean };
  shortfall: { inv: number; cash: number };
  derived: { inv: number; cash: number };
  reserve: number;
  mInv: number;
  mCash: number;
  target: number | null;
  realReturn: number;
  rentals: Rental[];
  longHorizon: boolean;
}

export function makeCtx(data: AppData): Ctx {
  const latest = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
  const s = data.settings;
  const derived = latest ? monthlySaving(data.transactions, latest.date) : { inv: 0, cash: 0 };
  const flags = capitalWithFlags(latest, data.transactions);
  const target = s ? targetAmountCents(s.expensesCents, s.withdrawalRate) : null;
  const mInv = s?.savingInvCents ?? derived.inv;
  const mCash = s?.savingCashCents ?? derived.cash;
  const realReturn = netRealReturn(s?.realReturn ?? RETURN_ASSUMPTIONS.realReturn, s?.feesRate ?? 0);
  const rentals = rentalsFor(data.properties);
  const g = latest && target !== null ? goalMonths(flags.capital, mInv, mCash, realReturn, target, rentals) : null;
  return {
    settings: s,
    latest,
    capital: flags.capital,
    negative: flags.negative,
    shortfall: flags.shortfall,
    derived,
    reserve: reserveBalance(data.transactions),
    mInv,
    mCash,
    target,
    realReturn,
    rentals,
    longHorizon: g?.kind === "months" && g.months > LONG_HORIZON_MONTHS,
  };
}

