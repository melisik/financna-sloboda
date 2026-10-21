import type { Recipe, StockItem } from "../storage/types";

export type CookResult = { ok: true; changed: StockItem[] } | { ok: false; problems: string[] };

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Odpočíta suroviny receptu zo skladu (D-127). Množstvo sa odpočíta v jednotke položky skladu.
 * Ak niektorá surovina chýba alebo nestačí, nič sa neodpočíta a vrátia sa dôvody.
 * Stav 0 je povolený; záporný stav nie.
 */
export function cookRecipe(recipe: Recipe, stock: StockItem[], now: string): CookResult {
  const needed = new Map<string, number>();
  const names = new Map<string, string | undefined>();
  for (const ing of recipe.ingredients) {
    needed.set(ing.stockItemId, (needed.get(ing.stockItemId) ?? 0) + ing.quantity);
    names.set(ing.stockItemId, ing.stockName);
  }

  const problems: string[] = [];
  const changed: StockItem[] = [];
  for (const [stockItemId, qty] of needed) {
    const item = stock.find((s) => s.id === stockItemId);
    if (!item) {
      const name = names.get(stockItemId);
      problems.push(name ? `„${name}“ už nie je v sklade` : "Niektorá surovina už nie je v sklade");
      continue;
    }
    const missing = round2(qty - item.quantity);
    if (missing > 0) {
      problems.push(`${item.name}: chýba ${missing} ${item.unit}`);
      continue;
    }
    changed.push({ ...item, quantity: round2(item.quantity - qty), updatedAt: now });
  }
  return problems.length > 0 ? { ok: false, problems } : { ok: true, changed };
}
