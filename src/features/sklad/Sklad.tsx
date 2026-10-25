import { useEffect, useState } from "react";
import { type Recipe, type StockItem, type WasteRecord, type ShoppingItem } from "../../storage/types";
import { addToShoppingList, missingForRecipe, restockOffers } from "../../domain/shopping";
import { ShoppingList } from "./ShoppingList";
import { wasteValueCents } from "../../domain/waste";
import type { Repository } from "../../storage/repository";
import { STOCK_STATUS_TEXT, daysUntil, sortForList, stockStatus } from "../../domain/stock";
import { StockWarning } from "../../ui/StockWarning";
import { preloadBarcodeReader } from "./barcode";
import { plural } from "../../domain/impact";
import { dateSk, eur, todayIso } from "../../ui/kit/format";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { uid } from "../../ui/kit/ids";
import { Field, asNum, btn, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";
import { hintStyle } from "../../ui/kit/controls";
import { card } from "../../ui/kit/controls";

import { qtyText } from "./format";
import { WasteSummary } from "./WasteSummary";
import { RecipesBlock } from "./Recepty";
import { StockForm } from "./StockForm";

/** Sklad potravín a recepty (D-127, D-141, D-155): položky, dátumy spotreby, uvarenie a skener obalu. Feature „sklad“ (docs/23). */

/** Sklad potravín (samostatná sekcia): položky, množstvo, dátum spotreby a upozornenia. */
/** Počet dní od dneška slovami: „dnes“, „za 1 deň“, „za 3 dni“, „pred 2 dňami“. */
function dniText(n: number): string {
  if (n === 0) return "dnes";
  if (n > 0) return `za ${n} ${n === 1 ? "deň" : n < 5 ? "dni" : "dní"}`;
  return `pred ${-n} ${-n === 1 ? "dňom" : "dňami"}`;
}

export function StockSection({ repo, items, recipes, wasteRecords, shoppingItems, today, onSaved }: { repo: Repository; items: StockItem[]; recipes: Recipe[]; wasteRecords: WasteRecord[]; shoppingItems: ShoppingItem[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<StockItem | "new" | null>(null);
  // Nová položka z kúpenej položky zoznamu: formulár sa predvyplní a po uložení sa položka zo zoznamu odstráni (D-302).
  const [fromList, setFromList] = useState<ShoppingItem | null>(null);
  // Položky, ktoré práve došli alebo klesli pod minimálnu zásobu: ponúknu sa raz na zoznam (D-302, docs/51 otázky 5 a 6).
  const [offers, setOffers] = useState<StockItem[]>([]);
  const offerAfter = (before: StockItem[], after: StockItem[]) => setOffers(restockOffers(before, after, shoppingItems));
  const addEntries = async (entries: Parameters<typeof addToShoppingList>[1]) => {
    const added = addToShoppingList(shoppingItems, entries, new Date().toISOString(), uid);
    try {
      if (added.length > 0) await repo.saveShoppingItems(added);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };
  // „Ešte použiteľné“ otvorí úpravu so zameraným dátumom spotreby; nič sa nezaznamená (D-301).
  const [focusExpiry, setFocusExpiry] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Vyhodiť (D-301): množstvo sa zníži a zapíše sa záznam o vyhodení; výdavok ani kapitál sa nemenia.
  const [discardId, setDiscardId] = useState<string | null>(null);
  const [discardQty, setDiscardQty] = useState<NumIn>("");
  const [err, setErr] = useState<string | null>(null);
  // Skener sa načíta pri otvorení Skladu, nie pri štarte appky; potom funguje aj offline (D-284).
  useEffect(() => preloadBarcodeReader(), []);

  // Recept, ktorý používa položku, sa po jej zmazaní nedá uvariť; preto sa to ukáže pri potvrdení.
  const usedIn = (id: string) => recipes.filter((r) => r.ingredients.some((ing) => ing.stockItemId === id)).map((r) => r.name);

  const remove = async (id: string) => {
    try {
      await repo.deleteStockItem(id);
      setConfirmId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const discard = async (i: StockItem) => {
    const q = asNum(discardQty);
    if (Number.isNaN(q) || q <= 0 || q > i.quantity) return setErr(`Vyhodiť sa dá 0 až ${qtyText(i.quantity)} ${i.unit}.`);
    const value = wasteValueCents(i, q);
    const now = new Date().toISOString();
    const record: WasteRecord = { id: uid(), date: todayIso(), name: i.name, quantity: q, unit: i.unit, ...(value !== undefined ? { valueCents: value } : {}), stockItemId: i.id, createdAt: now };
    try {
      const updated = { ...i, quantity: Math.round((i.quantity - q) * 1000) / 1000, updatedAt: now };
      await repo.discardStock(updated, record);
      offerAfter([i], [updated]);
      setDiscardId(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  // Karta jednej dávky položky; firstToUse označí dávku, ktorú treba spotrebovať ako prvú (D-236).
  const itemCard = (i: StockItem, firstToUse = false) => (
        <div key={i.id} style={{ ...card, marginBottom: 8 }}>
          <p style={{ margin: 0 }}><strong>{i.name}</strong>{firstToUse ? <> · <strong>Použiť ako prvé</strong></> : null}</p>
          <p style={{ margin: "4px 0" }}>{qtyText(i.quantity)} {i.unit}{i.unitPriceCents !== undefined ? ` · ${eur(i.unitPriceCents)} za ${i.unit}` : ""}{i.quantity === 0 ? " · došlo" : ""}</p>
          <p style={{ ...hintStyle, margin: "4px 0" }}>
            {i.expiryDate ? `Spotrebovať do ${dateSk(i.expiryDate ?? "")} (${dniText(daysUntil(today, i.expiryDate))})` : "Bez dátumu spotreby"}
            {i.expiryDate ? <>{" · "}{STOCK_STATUS_TEXT[stockStatus(i, today)]}</> : null}
          </p>
          {discardId === i.id ? (
            <div>
              <Field label="Vyhodiť množstvo" value={discardQty} step={0.01} onChange={setDiscardQty} hint={`najviac ${qtyText(i.quantity)} ${i.unit}`} />
              <button onClick={() => void discard(i)} style={btnDanger}>Potvrdiť vyhodenie</button>{" "}
              <button onClick={() => setDiscardId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : confirmId === i.id ? (
            <div>
              <p>Naozaj zmazať položku „{i.name}“?</p>
              {usedIn(i.id).length > 0 && (
                <p style={{ fontSize: "var(--font-small)" }}>Používa ju recept: {usedIn(i.id).join(", ")}. Po zmazaní bude recept hlásiť chýbajúcu surovinu.</p>
              )}
              <button onClick={() => remove(i.id)} style={btnDanger}>Zmazať</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => { setFocusExpiry(false); setEditing(i); }} style={btn}>Upraviť</button>{" "}
              {i.quantity > 0 && <><button onClick={() => { setDiscardQty(i.quantity); setDiscardId(i.id); }} style={btn}>Vyhodiť</button>{" "}</>}
              {i.quantity > 0 && stockStatus(i, today) === "prešlo" && <><button onClick={() => { setFocusExpiry(true); setEditing(i); }} style={btn}>Ešte použiteľné</button>{" "}</>}
              <button onClick={() => setConfirmId(i.id)} style={btnDanger}>Zmazať</button>
            </>
          )}
        </div>
  );

  // Viac dávok toho istého výrobku (rovnaký čiarový kód) je jedna skupina; dávky sa dajú rozkliknúť (D-236).
  const groupCard = (batches: StockItem[]) => {
    const units = new Set(batches.map((b) => b.unit));
    const total = batches.reduce((sum, b) => sum + b.quantity, 0);
    const first = batches.find((b) => b.quantity > 0);
    return (
      <div key={batches[0].barcode} style={{ ...card, marginBottom: 8 }}>
        <p style={{ margin: 0 }}><strong>{batches[0].name}</strong></p>
        <p style={{ margin: "4px 0" }}>
          {units.size === 1 ? `Spolu ${total} ${batches[0].unit}` : "Spolu (rôzne jednotky)"} · {batches.length} {plural(batches.length, "dávka", "dávky", "dávok")}
        </p>
        <details>
          <summary style={{ cursor: "pointer" }}>Dávky a dátumy</summary>
          {batches.map((b) => itemCard(b, b === first))}
        </details>
      </div>
    );
  };

  const sorted = sortForList(items, today);
  const byBarcode = new Map<string, StockItem[]>();
  for (const i of sorted) if (i.barcode) byBarcode.set(i.barcode, [...(byBarcode.get(i.barcode) ?? []), i]);
  const shownGroups = new Set<string>();
  const rows = sorted.flatMap((i) => {
    const code = i.barcode;
    const group = code ? byBarcode.get(code) ?? [] : [];
    if (!code || group.length < 2) return [itemCard(i)];
    if (shownGroups.has(code)) return [];
    shownGroups.add(code);
    return [groupCard(group)];
  });

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Potraviny doma a ich dátum spotreby. Názov a dátum môžete doplniť z fotky obalu; množstvo zadajte ručne.</p>
      <StockWarning items={items} today={today} />
      <WasteSummary records={wasteRecords} today={today} />
      {offers.length > 0 && (
        <div style={{ ...card, marginBottom: 8 }}>
          <p style={{ margin: 0 }}>Došlo alebo je pod minimálnou zásobou: {offers.map((o) => o.name).join(", ")}.</p>
          <button onClick={() => { void addEntries(offers.map((o) => ({ name: o.name, unit: o.unit, stockItemId: o.id }))); setOffers([]); }} style={btn}>Pridať na zoznam</button>{" "}
          <button onClick={() => setOffers([])} style={btn}>Nie</button>
        </div>
      )}
      {items.length === 0 && editing === null && <p>Zatiaľ nie sú zapísané položky skladu.</p>}
      {rows}
      {editing ? (
        <StockForm
          key={fromList?.id ?? (editing === "new" ? "new" : editing.id)}
          repo={repo}
          items={items}
          initial={editing === "new" ? null : editing}
          focusExpiry={focusExpiry}
          prefill={editing === "new" && fromList ? fromList : undefined}
          onDone={async (before, after) => {
            if (after) offerAfter(before ? [before] : [], [after]);
            if (fromList) {
              try { await repo.deleteShoppingItems([fromList.id]); } catch { setErr(STORAGE_ERROR); }
            }
            setFromList(null);
            setEditing(null);
            onSaved();
          }}
          onCancel={() => { setFromList(null); setEditing(null); }}
        />
      ) : (
        <button onClick={() => { setFromList(null); setEditing("new"); }} style={btnPrimary}>Pridať položku skladu</button>
      )}
      <ShoppingList repo={repo} items={shoppingItems} onToStock={(s) => { setFocusExpiry(false); setFromList(s); setEditing("new"); }} onSaved={onSaved} />
      <RecipesBlock repo={repo} recipes={recipes} stock={items} onSaved={onSaved} onCooked={offerAfter} onMissing={(r) => void addEntries(missingForRecipe(r, items))} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}
