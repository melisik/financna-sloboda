import type { GoalDisplay } from "./goalDisplay";

/**
 * Text dátumu cieľa pre Prehľad (FR-02, FR-10, D-019). Dátum sa zobrazí len v rámci 50 rokov (O-5).
 * formatDate dostane dátum YYYY-MM-DD a vráti čitateľný text (napr. „október 2031“).
 * savingZero = nie je zadané žiadne mesačné sporenie; vtedy sa používateľ vyzve, aby ho zadal.
 */
export function goalDateText(d: GoalDisplay, savingZero: boolean, formatDate: (iso: string) => string): string {
  switch (d.kind) {
    case "reached":
      return "Cieľ je dosiahnutý";
    case "unreachable":
      return savingZero ? "Pri tomto sporení cieľ nedosiahneš. Zadaj mesačné sporenie." : "Pri súčasnom sporení a výnose sa cieľ nedosiahne";
    case "over50":
      return "Viac ako 50 rokov. Zvýš mesačné sporenie, aby sa cieľ priblížil.";
    case "stale":
      return `${formatDate(d.date)}. Posledné vyhodnotenie je staršie ako dátum cieľa; urobte nové vyhodnotenie.`;
    case "date":
      return formatDate(d.date);
  }
}
