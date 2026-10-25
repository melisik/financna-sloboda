import type { Recipe, ShoppingItem, StockItem, StockUnit } from "./model/entities";

/** Návrh položky na nákupný zoznam. */
export interface ShoppingEntry {
  name: string;
  quantity?: number;
  unit?: StockUnit;
  stockItemId?: string;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Položku treba doplniť (D-302, docs/51 otázky 5 a 6): s minimálnou zásobou, keď je pod ňou;
 * bez nej, keď došlo (množstvo 0).
 */
export function needsRestock(item: StockItem): boolean {
  return item.minQuantity !== undefined ? item.quantity < item.minQuantity : item.quantity === 0;
}

/** Je položka skladu na zozname ako nekúpená (podľa odkazu alebo názvu)? */
function onList(list: ShoppingItem[], e: ShoppingEntry): boolean {
  const name = e.name.trim().toLowerCase();
  return list.some((s) => !s.done && ((e.stockItemId !== undefined && s.stockItemId === e.stockItemId) || s.name.trim().toLowerCase() === name));
}

/** Položky, ktoré zmenou prešli do stavu na doplnenie a ešte nie sú na zozname: tie sa ponúknu raz (nie stále). */
export function restockOffers(before: StockItem[], after: StockItem[], list: ShoppingItem[]): StockItem[] {
  return after.filter((a) => {
    const b = before.find((x) => x.id === a.id);
    return needsRestock(a) && !(b && needsRestock(b)) && !onList(list, { name: a.name, stockItemId: a.id });
  });
}

/** Suroviny receptu, ktorých je v sklade menej, než recept potrebuje; chýbajúca položka skladu celým množstvom. */
export function missingForRecipe(recipe: Recipe, stock: StockItem[]): ShoppingEntry[] {
  const out: ShoppingEntry[] = [];
  for (const ing of recipe.ingredients) {
    const item = stock.find((s) => s.id === ing.stockItemId);
    if (!item) {
      out.push({ name: ing.stockName ?? "Surovina", quantity: ing.quantity });
      continue;
    }
    const missing = round3(ing.quantity - item.quantity);
    if (missing > 0) out.push({ name: item.name, quantity: missing, unit: item.unit, stockItemId: item.id });
  }
  return out;
}

/** Nové položky zoznamu z návrhov; preskočí tie, ktoré už na zozname nekúpené sú. */
export function addToShoppingList(list: ShoppingItem[], entries: ShoppingEntry[], now: string, newId: () => string): ShoppingItem[] {
  const added: ShoppingItem[] = [];
  for (const e of entries) {
    if (onList([...list, ...added], e)) continue;
    added.push({ id: newId(), name: e.name.trim().slice(0, 80), ...(e.quantity !== undefined ? { quantity: e.quantity } : {}), ...(e.unit ? { unit: e.unit } : {}), ...(e.stockItemId ? { stockItemId: e.stockItemId } : {}), done: false, createdAt: now, updatedAt: now });
  }
  return added;
}

/** Text zoznamu na poslanie (napr. do správy): len nekúpené položky. */
export function shoppingText(list: ShoppingItem[]): string {
  const lines = list.filter((s) => !s.done).map((s) => `- ${s.name}${s.quantity !== undefined ? ` ${String(s.quantity).replace(".", ",")}${s.unit ? ` ${s.unit}` : ""}` : ""}`);
  return ["Nakúpiť:", ...lines].join("\n");
}
