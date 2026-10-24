import type { BudgetCategory, RecurringExpense, Transaction } from "./model/entities";
import type { Capital } from "./capital";
import { goalMonths, type Rental } from "./rentalGoal";
import { NECESSITY } from "./monthSummary";
import { isRecurringActive, monthlyShareCents } from "./recurring";

/** Horizont zobrazenia dátumu cieľa: 50 rokov (O-5, GC-12), rovnako ako v `goalDisplay`. */
const HORIZON_MONTHS = 600;

type Necessity = (typeof NECESSITY)[BudgetCategory];

/** Poradie skupín (D-290, docs/45 V3): menšie opakované rozhodnutia hore, nevyhnutné na konci. */
const GROUP_ORDER: Necessity[] = ["nie_nevyhnutne", "ostatne", "nevyhnutne"];

export interface ImpactItem {
  kind: "pravidelny" | "kategoria";
  name: string;
  necessity: Necessity;
  monthlyCents: number;
  /** Pri ročnom pravidelnom výdavku jeho ročná suma. */
  yearlyCents?: number;
  /** O koľko mesiacov skôr by bol cieľ, keby sa suma mesačne investovala (necelé číslo). */
  monthsEarlier: number;
}

export interface ImpactGroup {
  necessity: Necessity;
  items: ImpactItem[];
}

export type RecurringImpact =
  | { status: "no_goal" }
  | { status: "ok"; groups: ImpactGroup[]; window: { from: string; to: string }; categoriesShown: boolean };

const pad = (n: number) => String(n).padStart(2, "0");

/** Posledné 3 celé kalendárne mesiace pred mesiacom dneška (RRRR-MM-DD). */
export function averageWindow(today: string): { from: string; to: string } {
  const [y, m] = today.split("-").map(Number);
  const start = y * 12 + (m - 1) - 3;
  const end = start + 2;
  const lastDay = new Date(Date.UTC(Math.floor(end / 12), (end % 12) + 1, 0)).getUTCDate();
  return { from: `${Math.floor(start / 12)}-${pad((start % 12) + 1)}-01`, to: `${Math.floor(end / 12)}-${pad((end % 12) + 1)}-${pad(lastDay)}` };
}

/** Priemer je spoľahlivý, len ak prvá transakcia nie je neskôr ako prvý deň okna (3 celé mesiace histórie). */
export function hasHistory(transactions: Transaction[], from: string): boolean {
  return transactions.some((t) => t.date <= from);
}

/** Mesačný priemer výdavkov podľa kategórie v okne (všetky zdroje úhrady); bez kategórie je „nezaradené“. Od najvyššieho. */
export function categoryAverages(transactions: Transaction[], window: { from: string; to: string }): { name: string; category: BudgetCategory | null; monthlyCents: number }[] {
  const sums = new Map<BudgetCategory | null, number>();
  for (const t of transactions) {
    if (t.type !== "vydavok" || t.date < window.from || t.date > window.to) continue;
    const key = t.category ?? null;
    sums.set(key, (sums.get(key) ?? 0) + t.amountCents);
  }
  return [...sums.entries()]
    .map(([category, sum]) => ({ name: category ?? "nezaradené", category, monthlyCents: Math.round(sum / 3) }))
    .filter((c) => c.monthlyCents > 0)
    .sort((a, b) => b.monthlyCents - a.monthlyCents || a.name.localeCompare(b.name, "sk"));
}

/**
 * Opakované výdavky a dátum cieľa (D-290, docs/45: U1, V3, S1). Pre pravidelné výdavky (D-124) a priemery kategórií
 * za 3 celé mesiace: o koľko mesiacov skôr by bol cieľ, keby sa suma mesačne investovala (opak D-275).
 * Kapitál je z posledného vyhodnotenia (D-285). Splátky úverov a hypoték sa nerátajú. Nič sa neukladá.
 */
export function recurringImpact(p: {
  transactions: Transaction[];
  recurring: RecurringExpense[];
  today: string;
  capital: Capital;
  mInv: number;
  mCash: number;
  rate: number;
  targetCents: number;
  rentals: Rental[];
}): RecurringImpact {
  const now = goalMonths(p.capital, p.mInv, p.mCash, p.rate, p.targetCents, p.rentals);
  if (now.kind !== "months" || !Number.isFinite(now.months) || now.months <= 0 || now.months > HORIZON_MONTHS) return { status: "no_goal" };
  const earlier = (monthlyCents: number) => {
    const g = goalMonths(p.capital, p.mInv + monthlyCents, p.mCash, p.rate, p.targetCents, p.rentals);
    return g.kind === "months" ? now.months - g.months : 0;
  };

  const window = averageWindow(p.today);
  const categoriesShown = hasHistory(p.transactions, window.from);
  const items: ImpactItem[] = [
    ...p.recurring
      .filter((e) => isRecurringActive(e, p.today))
      .map((e) => {
        const monthlyCents = monthlyShareCents(e);
        return {
          kind: "pravidelny" as const,
          name: e.name,
          necessity: NECESSITY[e.category],
          monthlyCents,
          ...(e.frequency === "rocne" ? { yearlyCents: e.amountCents } : {}),
          monthsEarlier: earlier(monthlyCents),
        };
      }),
    ...(categoriesShown
      ? categoryAverages(p.transactions, window).map((c) => ({
          kind: "kategoria" as const,
          name: c.name,
          necessity: c.category ? NECESSITY[c.category] : ("ostatne" as const),
          monthlyCents: c.monthlyCents,
          monthsEarlier: earlier(c.monthlyCents),
        }))
      : []),
  ];

  const groups = GROUP_ORDER.map((necessity) => ({
    necessity,
    items: items.filter((i) => i.necessity === necessity).sort((a, b) => b.monthlyCents - a.monthlyCents || a.name.localeCompare(b.name, "sk")),
  })).filter((g) => g.items.length > 0);
  return { status: "ok", groups, window, categoriesShown };
}
