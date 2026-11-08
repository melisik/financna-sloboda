import type { AppData, Property, Settings, Snapshot } from "./model/entities";
import type { Capital } from "./capital";
import { targetAmountCents } from "./goal";
import { monthlySaving } from "./saving";
import { LONG_HORIZON_MONTHS, netRealReturn, RETURN_ASSUMPTIONS } from "./assumptions";
import { goalMonths, rentalsFor, type Rental } from "./rentalGoal";
import { capitalWithFlags, reserveBalance } from "./ledger";
import { netPropertyValueCents } from "./property";
import { householdMonthBalance } from "./householdBalance";
import { monthlyCashFlow } from "./monthlyCashFlow";

/** Kontext prehľadu: stav kapitálu, cieľ a nastavenia z dát (FR-02, FR-04, D-121). Čistý výpočet, bez UI. */
export interface Ctx {
  settings: Settings | null;
  latest: Snapshot | null;
  /** Kapitál pri poslednom vyhodnotení (K_L): z neho je oficiálny dátum cieľa a pokrok (FR-04, D-024, D-285). */
  evaluated: Capital;
  /** Pracovný kapitál (K_pred): K_L a transakcie po vyhodnotení (D-121). Len pre predbežný dopad, nie pre oficiálny cieľ. */
  capital: Capital;
  negative: { inv: boolean; cash: boolean };
  shortfall: { inv: number; cash: number };
  derived: { inv: number; cash: number };
  reserve: number;
  mInv: number;
  mCash: number;
  m: number; // Voľný mesačný peňažný tok = príjmy - všetky výdavky (D-031, D-040)
  c: number; // Plánované mesačné investovanie (užívateľova rozhodovacia hodnota, prozatím rovné m)
  K_inv: number; // Investičný kapitál (identický s capital.inv)
  K_cash: number; // Likvidný kapitál (identický s capital.cash)
  K_nem: number; // Čistá hodnota všetkých nehnuteľností (vlastné + prenajímané) (D-080, D-268)
  K_total: number; // Celkový majetok = K_inv + K_cash + K_nem (D-268)
  K_FIRE: number; // Investičný kapitál pre cieľ FIRE = K_inv + K_cash (bez K_nem, D-268)
  target: number | null;
  realReturn: number;
  rentals: Rental[];
  longHorizon: boolean;
}

export function makeCtx(data: AppData): Ctx {
  const latest = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1) ?? null;
  const s = data.settings;
  const derived = latest ? monthlySaving(data.transactions, latest.date) : { inv: 0, cash: 0, nem: 0 };
  const flags = capitalWithFlags(latest, data.transactions);
  const target = s ? targetAmountCents(s.expensesCents, s.withdrawalRate) : null;
  const mInv = s?.savingInvCents ?? derived.inv;
  const mCash = s?.savingCashCents ?? derived.cash;
  const m = latest ? monthlyCashFlow(data, latest.date) : 0; // Voľný peňažný tok (príjmy - všetky výdavky)
  const c = s?.savingInvCents ?? 0; // Plánovaný mesačný príspevek do investícií
  const realReturn = netRealReturn(s?.realReturn ?? RETURN_ASSUMPTIONS.realReturn, s?.feesRate ?? 0);
  const rentals = rentalsFor(data.properties);

  // K_nem: čistá hodnota všetkých nehnuteľností (vlastné + prenajímané) (D-080, D-268)
  const nem = data.properties
    .reduce((sum, p) => sum + netPropertyValueCents(p), 0);

  const evaluated: Capital = latest ? { inv: latest.investmentsCents, cash: latest.cashCents, nem } : { inv: 0, cash: 0, nem };
  const K_FIRE = flags.capital.inv + flags.capital.cash; // K_inv + K_cash
  const g = latest && target !== null ? goalMonths(evaluated, mInv, mCash, realReturn, target, rentals) : null;
  const capital: Capital = { inv: flags.capital.inv, cash: flags.capital.cash, nem };
  return {
    settings: s,
    latest,
    evaluated,
    capital,
    negative: flags.negative,
    shortfall: flags.shortfall,
    derived,
    reserve: reserveBalance(data.transactions),
    mInv,
    mCash,
    m,
    c,
    K_inv: capital.inv,
    K_cash: capital.cash,
    K_nem: nem,
    K_total: capital.inv + capital.cash + nem,
    K_FIRE,
    target,
    realReturn,
    rentals,
    longHorizon: g?.kind === "months" && g.months > LONG_HORIZON_MONTHS,
  };
}

