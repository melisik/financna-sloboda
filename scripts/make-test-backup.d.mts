/** Vráti index mesiaca: jan 2026 = 2026*12+0, nov 2026 = 2026*12+10 */
export declare function monthIndex(iso: string): number;

/** Posunie dátum YYYY-MM-DD o daný počet mesiacov; správne ošetrí rôznu dĺžku mesiacov. */
export declare function addMonths(iso: string, months: number): string;

/**
 * Vypočíta posun v celých mesiacoch od referenčného dátumu zálohy (exportedAt)
 * po dátum nasadenia (deployDate). Môže byť záporný (spätné posúvanie) alebo nula.
 */
export declare function computeShift(refDate: string, deployDate: string): number;

/**
 * Posunie všetky dátumy (vzor YYYY-MM-DD) v texte zálohy o daný počet mesiacov.
 * Bez orezávania – budúce dátumy si zachovajú relatívny odstup od referenčného dátumu.
 */
export declare function shiftDates(text: string, shift: number): string;
