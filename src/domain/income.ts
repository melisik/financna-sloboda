import type { RegularIncome } from "./model/entities";

/** Príjem platí dnes, ak sa dnešný dátum nachádza medzi začiatkom a koncom (koniec bez hodnoty = trvá). */
export function isIncomeActive(i: RegularIncome, today: string): boolean {
  return i.startDate <= today && (i.endDate === undefined || today <= i.endDate);
}

/** Súčet platných PRAVIDELNÝCH príjmov za mesiac v centoch. Nepravidelné sa nerátajú; sporenie m sa nemení (D-102, D-109). */
export function monthlyIncomeCents(list: RegularIncome[], today: string): number {
  return list
    .filter((i) => i.frequency === "mesacne" && isIncomeActive(i, today))
    .reduce((sum, i) => sum + i.amountCents, 0);
}

/** Nepravidelné príjmy sa zobrazujú zvlášť a do mesačného súčtu sa nerátajú (D-109). */
export function irregularIncomes(list: RegularIncome[]): RegularIncome[] {
  return list.filter((i) => i.frequency === "nepravidelne");
}
