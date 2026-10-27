/**
 * Demo dáta (D-343): syntetické, bez reálnych súm ani osobných údajov.
 * withdrawalRate = 0.037 (D-049).
 */
import type { AppData } from "../domain/model/entities";

const today = "2026-10-27";

function txId(n: number) { return `demo-tx-${n}`; }
function snapId(n: number) { return `demo-snap-${n}`; }

function tx(n: number, date: string, type: "investicia" | "sporenie" | "vydavok", amountCents: number, note: string) {
  return { id: txId(n), date, type, amountCents, note, createdAt: `${date}T10:00:00Z`, updatedAt: `${date}T10:00:00Z` };
}

function snap(n: number, date: string, invCents: number, cashCents: number) {
  return { id: snapId(n), date, investmentsCents: invCents, cashCents, createdAt: `${date}T10:00:00Z` };
}

// 24 mesačných vyhodnotení – postupný rast
const snapshots = Array.from({ length: 24 }, (_, i) => {
  const month = String(((i % 12) + 1)).padStart(2, "0");
  const year = 2024 + Math.floor(i / 12);
  return snap(i + 1, `${year}-${month}-28`, 5_000_00 + i * 350_00, 800_00 + i * 60_00);
});

// 50 transakcií: príjmy, výdavky, sporenie
const transactions = [
  tx(1, "2024-01-10", "vydavok", 45000, "Potraviny"),
  tx(2, "2024-01-15", "vydavok", 12000, "Restauracia"),
  tx(3, "2024-01-20", "investicia", 30000, "ETF vklad"),
  tx(4, "2024-02-12", "vydavok", 43000, "Potraviny"),
  tx(5, "2024-02-18", "vydavok", 8000, "Drogeria"),
  tx(6, "2024-02-20", "investicia", 30000, "ETF vklad"),
  tx(7, "2024-03-08", "vydavok", 47000, "Potraviny"),
  tx(8, "2024-03-14", "vydavok", 15000, "Oblecenie"),
  tx(9, "2024-03-20", "investicia", 30000, "ETF vklad"),
  tx(10, "2024-04-11", "vydavok", 44000, "Potraviny"),
  tx(11, "2024-04-20", "investicia", 35000, "ETF vklad"),
  tx(12, "2024-05-10", "vydavok", 46000, "Potraviny"),
  tx(13, "2024-05-20", "investicia", 30000, "ETF vklad"),
  tx(14, "2024-06-12", "vydavok", 42000, "Potraviny"),
  tx(15, "2024-06-20", "investicia", 50000, "ETF vklad - odmena"),
  tx(16, "2024-07-09", "vydavok", 48000, "Potraviny"),
  tx(17, "2024-07-22", "vydavok", 90000, "Dovolenka"),
  tx(18, "2024-07-20", "investicia", 20000, "ETF vklad"),
  tx(19, "2024-08-08", "vydavok", 45000, "Potraviny"),
  tx(20, "2024-08-20", "investicia", 30000, "ETF vklad"),
  tx(21, "2024-09-10", "vydavok", 44000, "Potraviny"),
  tx(22, "2024-09-20", "investicia", 30000, "ETF vklad"),
  tx(23, "2024-10-11", "vydavok", 46000, "Potraviny"),
  tx(24, "2024-10-20", "investicia", 30000, "ETF vklad"),
  tx(25, "2024-11-12", "vydavok", 43000, "Potraviny"),
  tx(26, "2024-11-20", "investicia", 30000, "ETF vklad"),
  tx(27, "2024-12-08", "vydavok", 55000, "Vianocne nakupy"),
  tx(28, "2024-12-20", "investicia", 60000, "ETF vklad - 13. plat"),
  tx(29, "2025-01-10", "vydavok", 45000, "Potraviny"),
  tx(30, "2025-01-20", "investicia", 35000, "ETF vklad"),
  tx(31, "2025-02-10", "vydavok", 44000, "Potraviny"),
  tx(32, "2025-02-20", "investicia", 35000, "ETF vklad"),
  tx(33, "2025-03-12", "vydavok", 46000, "Potraviny"),
  tx(34, "2025-03-20", "investicia", 35000, "ETF vklad"),
  tx(35, "2025-04-10", "vydavok", 44000, "Potraviny"),
  tx(36, "2025-04-20", "investicia", 35000, "ETF vklad"),
  tx(37, "2025-05-10", "vydavok", 45000, "Potraviny"),
  tx(38, "2025-05-20", "investicia", 35000, "ETF vklad"),
  tx(39, "2025-06-12", "vydavok", 44000, "Potraviny"),
  tx(40, "2025-06-20", "investicia", 35000, "ETF vklad"),
  tx(41, "2025-07-10", "vydavok", 48000, "Potraviny"),
  tx(42, "2025-07-22", "vydavok", 80000, "Dovolenka"),
  tx(43, "2025-07-20", "investicia", 20000, "ETF vklad"),
  tx(44, "2025-08-10", "vydavok", 45000, "Potraviny"),
  tx(45, "2025-08-20", "investicia", 35000, "ETF vklad"),
  tx(46, "2025-09-10", "vydavok", 44000, "Potraviny"),
  tx(47, "2025-09-20", "investicia", 35000, "ETF vklad"),
  tx(48, "2026-01-10", "vydavok", 46000, "Potraviny"),
  tx(49, "2026-01-20", "investicia", 40000, "ETF vklad"),
  tx(50, "2026-10-10", "vydavok", 45000, "Potraviny"),
];

export const DEMO_APP_DATA: AppData = {
  settings: {
    expensesCents: 2_000_00, // 2 000 € ročné výdavky pri nezávislosti
    withdrawalRate: 0.037, // D-049
    realReturn: 0.035, // D-050
    reserveCents: 6_000_00,
    thresholdCents: 100_00,
  },
  transactions,
  snapshots,
  properties: [
    {
      id: "demo-prop-1",
      name: "Byt Bratislava",
      mode: "vlastne_byvanie",
      valueCents: 180_000_00,
      valueDate: today,
      mortgageBalanceCents: 115_000_00,
      balanceDate: today,
      monthlyPaymentCents: 700_00,
      mortgageRate: 0.042,
      createdAt: `${today}T10:00:00Z`,
      updatedAt: `${today}T10:00:00Z`,
    },
  ],
  assets: [],
  investments: [],
  liabilities: [],
  incomes: [],
  budgets: [],
  recurringExpenses: [],
  stockItems: [],
  recipes: [],
  dogs: [],
  goals: [],
  wasteRecords: [],
  shoppingItems: [],
};
