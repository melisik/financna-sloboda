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

// ============ Balík B: Príjmy a Dátumy (B1–B4) ============

/**
 * B1: Validácia dátumov príjmov.
 * Vraciá chybovú správu, ak endDate < startDate, inak empty string.
 */
export function validateIncomeDate(startDate: string, endDate: string | undefined): string {
  if (!endDate || endDate.trim() === "") return "";
  if (endDate < startDate) {
    return "Koniec nesmie byť pred začiatkom.";
  }
  return "";
}

/**
 * B3: Počet skutočných výplat v rozsahu [startDate, endDate].
 * Ak endDate nie je nastavené, vracia -1 (znamená "pravidelný").
 * Počíta len mesiacové príjmy s nastavením dayOfMonth.
 *
 * Príklad:
 * - Od 1.11 do 30.11, výplatný 15. → 1 výskyt
 * - Od 1.11 do 31.12, výplatný 15. → 2 výskyty (nov + dec)
 * - Bez endDate → -1 (pravidelný mesačný)
 * - Ak v období nenastane výplatný deň → 0 s varovanie
 */
export function countPaymentOccurrences(
  startDate: string,
  endDate: string | undefined,
  dayOfMonth: number | undefined
): { count: number; warning?: string } {
  // Bez endDate = pravidelný mesačný príjem
  if (!endDate || endDate.trim() === "") {
    return { count: -1 };
  }

  // Bez dayOfMonth sa nedá počítať presne
  if (dayOfMonth === undefined) {
    return { count: -1 };
  }

  const start = new Date(startDate + "T00:00:00Z");
  const end = new Date(endDate + "T00:00:00Z");

  if (start > end) {
    return { count: 0, warning: "Začiatok je za koncom." };
  }

  let count = 0;
  // Iterujeme mesiacmi od začiatku po koniec
  const startYear = start.getUTCFullYear();
  const startMonth = start.getUTCMonth();
  const endYear = end.getUTCFullYear();
  const endMonth = end.getUTCMonth();

  for (let year = startYear; year <= endYear; year++) {
    const monthStart = year === startYear ? startMonth : 0;
    const monthEnd = year === endYear ? endMonth : 11;

    for (let month = monthStart; month <= monthEnd; month++) {
      // Počet dní v tomto mesiaci
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
      const actualDay = Math.min(dayOfMonth, daysInMonth);

      const paymentDate = new Date(`${year}-${String(month + 1).padStart(2, "0")}-${String(actualDay).padStart(2, "0")}T00:00:00Z`);

      // Ak je výplatný deň v rozsahu, počítame ho
      if (paymentDate >= start && paymentDate <= end) {
        count++;
      }
    }
  }

  if (count === 0) {
    return { count: 0, warning: `V období od ${startDate} do ${endDate} nenastane výplatný deň ${dayOfMonth}.` };
  }

  return { count };
}
