import { useState } from "react";
import { STOCK_UNITS, type StockItem, type StockUnit, type Transaction } from "../../storage/types";
import type { Repository } from "../../storage/repository";
import { receiptItemToStock } from "../../domain/waste";
import { plural } from "../../domain/impact";
import { eur } from "../../ui/kit/format";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { uid } from "../../ui/kit/ids";
import { btn, btnPrimary, hintStyle } from "../../ui/kit/controls";

/**
 * Položky dokladu (D-129) do skladu s cenou za jednotku (D-301, docs/51 3.1). Predvolene nič nie je vybrané:
 * doklad z drogérie by inak zaplnil sklad. Výdavok ani kapitál sa nemenia; peniaze sa minuli pri nákupe.
 */
export function ReceiptToStock({ repo, transaction, onSaved }: { repo: Repository; transaction: Transaction; onSaved: () => void }) {
  const items = transaction.receiptItems ?? [];
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Record<number, boolean>>({});
  const [units, setUnits] = useState<Record<number, StockUnit>>({});
  const [msg, setMsg] = useState<string | null>(null);
  if (items.length === 0) return null;

  const add = async () => {
    const chosen = items.map((r, n) => ({ r, n })).filter(({ r, n }) => picked[n] && r.amountCents > 0);
    if (chosen.length === 0) return setMsg("Vyber aspoň jednu položku.");
    const now = new Date().toISOString();
    const stock: StockItem[] = chosen.map(({ r, n }) => {
      const s = receiptItemToStock(r);
      return { id: uid(), name: s.name, quantity: s.quantity, unit: units[n] ?? "ks", unitPriceCents: s.unitPriceCents, sourceTransactionId: transaction.id, createdAt: now, updatedAt: now };
    });
    try {
      await repo.applyStockChanges(stock);
    } catch {
      return setMsg(STORAGE_ERROR);
    }
    setPicked({});
    setOpen(false);
    setMsg(`Do skladu ${stock.length === 1 ? "pribudla" : "pribudli"} ${stock.length} ${plural(stock.length, "položka", "položky", "položiek")}.`);
    onSaved();
  };

  return (
    <div style={{ margin: "8px 0" }}>
      {!open ? (
        <button onClick={() => { setMsg(null); setOpen(true); }} style={btn}>Pridať do skladu</button>
      ) : (
        <div>
          <p style={hintStyle}>Vyber potraviny, ktoré pridáš do skladu. Dátum spotreby doplníš v Sklade.</p>
          {items.map((r, n) => r.amountCents <= 0 ? (
            // Zľava nie je potravina; v sklade by mala zápornú cenu a zálohu by nebolo možné obnoviť (revízia 2026-10-25d, V-1).
            <p key={`${r.code}-${n}`} style={{ ...hintStyle, margin: "6px 0" }}>{r.name}: zľava sa do skladu nepridáva.</p>
          ) : (
            <div key={`${r.code}-${n}`} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, margin: "6px 0" }}>
              <label style={{ flex: "1 1 180px" }}>
                <input type="checkbox" checked={!!picked[n]} onChange={(e) => setPicked({ ...picked, [n]: e.target.checked })} /> {r.name}
                <span style={{ display: "block", ...hintStyle }}>{String(r.quantity).replace(".", ",")} × {eur(receiptItemToStock(r).unitPriceCents)}</span>
              </label>
              <select aria-label={`Jednotka: ${r.name}`} value={units[n] ?? "ks"} onChange={(e) => setUnits({ ...units, [n]: e.target.value as StockUnit })} style={{ minHeight: 44 }}>
                {STOCK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          ))}
          <button onClick={() => void add()} style={btnPrimary}>Pridať vybrané do skladu</button>{" "}
          <button onClick={() => setOpen(false)} style={btn}>Zrušiť</button>
        </div>
      )}
      {msg && <p>{msg}</p>}
    </div>
  );
}
