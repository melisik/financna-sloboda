import type { StockItem } from "./model/entities";

/** Počet dní, za ktoré sa upozorní na blížiaci sa dátum spotreby. */
export const EXPIRY_WARNING_DAYS = 3;

export type StockStatus = "bez_datumu" | "prešlo" | "blizi_sa" | "v_poriadku";

/** Počet dní od dneška do dátumu (záporný, ak je dátum prešlý). Výpočet v UTC, bez časového pásma. */
export function daysUntil(todayIso: string, dateIso: string): number {
  const [y1, m1, d1] = todayIso.split("-").map(Number);
  const [y2, m2, d2] = dateIso.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function stockStatus(item: StockItem, today: string): StockStatus {
  if (item.expiryDate === undefined) return "bez_datumu";
  const days = daysUntil(today, item.expiryDate);
  if (days < 0) return "prešlo";
  if (days <= EXPIRY_WARNING_DAYS) return "blizi_sa";
  return "v_poriadku";
}

/** Položky, ktorých dátum spotreby je prešlý alebo sa blíži; najskôr končiace hore. Položky, ktoré došli, sa nerátajú. */
export function expiringItems(items: StockItem[], today: string): StockItem[] {
  return items
    .filter((i) => {
      if (i.quantity === 0) return false;
      const s = stockStatus(i, today);
      return s === "prešlo" || s === "blizi_sa";
    })
    .sort((a, b) => (a.expiryDate ?? "").localeCompare(b.expiryDate ?? ""));
}

const LIST_RANK: Record<StockStatus, number> = { "prešlo": 0, "blizi_sa": 1, "v_poriadku": 2, "bez_datumu": 3 };

/**
 * Poradie v zozname skladu: najskôr prešlé, potom blížiace sa, v poriadku a bez dátumu;
 * položky s nulovým množstvom (došlo) sú na konci. Medzi rovnakými sa berie skorší dátum a potom názov.
 */
export function sortForList(items: StockItem[], today: string): StockItem[] {
  const rank = (i: StockItem) => (i.quantity === 0 ? 4 : LIST_RANK[stockStatus(i, today)]);
  return [...items].sort((a, b) =>
    rank(a) - rank(b) || (a.expiryDate ?? "").localeCompare(b.expiryDate ?? "") || a.name.localeCompare(b.name, "sk"),
  );
}
