import type { AppData } from "./model/entities";

/**
 * Voľný mesačný peňažný tok m (D-031, D-040, D-346):
 * Priemer mesačnej bilancii domácnosti (príjmy - všetky výdavky vrátane splátok hypoték)
 * za posledných 12 mesiacov (max), počítaný podľa dátumu snapshotu.
 * Sumy v centoch.
 */
export function monthlyCashFlow(data: AppData, lastReviewIso: string): number {
  const monthIndex = (date: string): number => {
    const [y, m] = date.split("-").map(Number);
    return y * 12 + m;
  };

  const endMonthIdx = monthIndex(lastReviewIso);
  const windowStart = endMonthIdx - 11;

  const relevantTransactions = (data.transactions ?? []).filter((t) => {
    const tMonthIdx = monthIndex(t.date);
    return tMonthIdx >= windowStart && tMonthIdx <= endMonthIdx && t.date <= lastReviewIso;
  });

  // Príjmy z transakcií (type === "prijem")
  const transactionIncomes = relevantTransactions
    .filter((t) => t.type === "prijem")
    .reduce((sum, t) => sum + t.amountCents, 0);

  // Nájom: mesačný z nehnuteľností v režime "prenajom"
  let rentalIncome = 0;
  for (const prop of data.properties) {
    if (prop.mode === "prenajom" && prop.monthlyRentCents && prop.monthlyRentCents > 0) {
      rentalIncome += prop.monthlyRentCents;
    }
  }

  // Príjmy z incomes[] — len mesačné (frequency === "mesacne"), aktívne v relevantnom období
  let regularMonthlyIncome = 0;
  for (const income of data.incomes ?? []) {
    if (income.frequency === "mesacne" && income.amountCents > 0) {
      // Príjem musí byť aktívny v relevantnom období (startDate ≤ posledný deň, bez endDate alebo endDate ≥ prvý deň)
      const periodStart = new Date(lastReviewIso);
      periodStart.setMonth(periodStart.getMonth() - 11);
      const periodEnd = lastReviewIso;

      if (income.startDate <= periodEnd && (!income.endDate || income.endDate >= periodStart.toISOString().split("T")[0])) {
        regularMonthlyIncome += income.amountCents;
      }
    }
  }

  const totalIncomes = transactionIncomes + rentalIncome + regularMonthlyIncome;

  // Výdavky: transakcie "vydavok" (vrátane splátok hypoték)
  const expenses = relevantTransactions
    .filter((t) => t.type === "vydavok")
    .reduce((sum, t) => sum + t.amountCents, 0);

  // Počet mesiacov s transakciami
  const monthsWithData = Math.max(1, new Set(relevantTransactions.map((t) => monthIndex(t.date))).size);

  // Voľný peňažný tok = príjmy - výdavky, priemer za mesiacov s dátami
  const balance = totalIncomes - expenses;
  return Math.round(balance / monthsWithData);
}
