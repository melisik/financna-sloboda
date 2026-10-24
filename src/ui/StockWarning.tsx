import { STOCK_STATUS_TEXT, expiringItems, stockStatus } from "../domain/stock";
import { plural } from "../domain/impact";
import type { StockItem } from "../storage/types";
import { dateSk } from "./kit/format";
import { calloutStyle } from "./kit/controls";

/**
 * Upozornenie na položky skladu s blížiacou sa alebo prešlou spotrebou (D-237). Zbalené je iba súhrn,
 * po rozkliknutí sú všetky ohrozené položky s dátumom. Zobrazuje sa v Sklade aj v Prehľade.
 */
export function StockWarning({ items, today }: { items: StockItem[]; today: string }) {
  const warnings = expiringItems(items, today);
  if (warnings.length === 0) return null;
  return (
    <div style={{ ...calloutStyle("warn"), marginBottom: 12 }}>
      <details>
        <summary style={{ cursor: "pointer" }}>
          Pozor: {warnings.length} {plural(warnings.length, "položka", "položky", "položiek")} s blížiacou sa alebo prešlou spotrebou
        </summary>
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          {warnings.map((w) => (
            <li key={w.id}>{w.name}: {STOCK_STATUS_TEXT[stockStatus(w, today)]} ({dateSk(w.expiryDate ?? "")})</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
