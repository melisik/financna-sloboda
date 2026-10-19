import type { RegularIncome } from "../storage/types";

/** Príjem platí dnes, ak sa dnešný dátum nachádza medzi začiatkom a koncom (koniec bez hodnoty = trvá). */
export function isIncomeActive(i: RegularIncome, today: string): boolean {
  return i.startDate <= today && (i.endDate === undefined || today <= i.endDate);
}

/** Súčet platných pravidelných príjmov za mesiac v centoch. Nemení sporenie m (D-102). */
export function monthlyIncomeCents(list: RegularIncome[], today: string): number {
  return list.filter((i) => isIncomeActive(i, today)).reduce((sum, i) => sum + i.amountCents, 0);
}
