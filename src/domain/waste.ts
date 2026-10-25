import type { ReceiptItem, StockItem, WasteRecord } from "./model/entities";

/** Položka dokladu (D-129) ako položka skladu: množstvo z dokladu, cena za jednotku zo sumy riadku (D-301). */
export function receiptItemToStock(r: ReceiptItem): { name: string; quantity: number; unitPriceCents: number } {
  return { name: r.name.slice(0, 80), quantity: r.quantity, unitPriceCents: Math.round(r.amountCents / r.quantity) };
}

/** Hodnota vyhodeného množstva; bez ceny pri položke undefined. */
export function wasteValueCents(item: StockItem, quantity: number): number | undefined {
  return item.unitPriceCents === undefined ? undefined : Math.round(item.unitPriceCents * quantity);
}

/** Cena za jednotku po pripočítaní rovnakého výrobku (D-234): vážený priemer; chýbajúca cena sa nepočíta. */
export function mergedUnitPriceCents(existing: StockItem, addedQuantity: number, addedPriceCents: number | undefined): number | undefined {
  if (addedPriceCents === undefined) return existing.unitPriceCents;
  if (existing.unitPriceCents === undefined || existing.quantity <= 0) return addedPriceCents;
  const total = existing.quantity + addedQuantity;
  return Math.round((existing.unitPriceCents * existing.quantity + addedPriceCents * addedQuantity) / total);
}

/** Vyhodené tento mesiac a tento rok (D-301). Záznamy bez ceny sa rátajú do počtu, nie do sumy. */
export function wasteSummary(records: WasteRecord[], today: string): { monthCents: number; monthCount: number; monthWithoutPrice: number; yearCents: number; yearCount: number } {
  const month = records.filter((r) => r.date.slice(0, 7) === today.slice(0, 7));
  const year = records.filter((r) => r.date.slice(0, 4) === today.slice(0, 4));
  const sum = (l: WasteRecord[]) => l.reduce((s, r) => s + (r.valueCents ?? 0), 0);
  return { monthCents: sum(month), monthCount: month.length, monthWithoutPrice: month.filter((r) => r.valueCents === undefined).length, yearCents: sum(year), yearCount: year.length };
}
