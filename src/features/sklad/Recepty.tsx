import { useState } from "react";
import { type Recipe, type RecipeIngredient, type StockItem } from "../../storage/types";
import { missingForRecipe } from "../../domain/shopping";
import type { Repository } from "../../storage/repository";
import { cookRecipe } from "../../domain/recipe";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { uid } from "../../ui/kit/ids";
import { Field, asNum, btn, inp, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";
import { hintStyle } from "../../ui/kit/controls";
import { card } from "../../ui/kit/controls";

import { qtyText } from "./format";

export function RecipesBlock({ repo, recipes, stock, onSaved, onCooked, onMissing }: { repo: Repository; recipes: Recipe[]; stock: StockItem[]; onSaved: () => void; onCooked: (before: StockItem[], after: StockItem[]) => void; onMissing: (r: Recipe) => void }) {
  const [editing, setEditing] = useState<Recipe | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [pending, setPending] = useState<Recipe | null>(null);
  const blockedText = (r: Recipe, problems: string[]) => `Recept „${r.name}“ sa neodpočítal, sklad ostáva bez zmeny. ${problems.join("; ")}.`;

  // Uvarenie odpočíta suroviny len vtedy, keď všetky stačia (D-127). Najprv sa ukáže, čo sa odpočíta; sklad sa zmení až po potvrdení.
  const askCook = (r: Recipe) => {
    const res = cookRecipe(r, stock, new Date().toISOString());
    if (!res.ok) {
      setPending(null);
      setResult({ ok: false, text: blockedText(r, res.problems) });
      return;
    }
    setResult(null);
    setPending(r);
  };

  const confirmCook = async (r: Recipe) => {
    // Sklad sa mohol zmeniť od náhľadu, preto sa množstvá overia znova.
    const res = cookRecipe(r, stock, new Date().toISOString());
    if (!res.ok) {
      setPending(null);
      setResult({ ok: false, text: blockedText(r, res.problems) });
      return;
    }
    try {
      await repo.applyStockChanges(res.changed);
      onCooked(stock.filter((s) => res.changed.some((c) => c.id === s.id)), res.changed);
      setPending(null);
      setResult({ ok: true, text: `Uvarené: „${r.name}“. Suroviny sú odpočítané zo skladu.` });
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const remove = async (id: string) => {
    try {
      await repo.deleteRecipe(id);
      setPending(null);
      setConfirmId(null);
      setResult(null);
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ marginTop: 16 }}>
      <h4 style={{ fontSize: "var(--font-text)" }}>Recepty</h4>
      <p style={hintStyle}>Pri uvarení sa suroviny odpočítajú zo skladu. Ak niečo chýba, nič sa neodpočíta.</p>
      {recipes.length === 0 && editing === null && <p>Zatiaľ nie sú zapísané recepty.</p>}
      {recipes.map((r) => (
        <div key={r.id} style={{ ...card, marginBottom: 8 }}>
          <p style={{ margin: 0 }}><strong>{r.name}</strong></p>
          <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "var(--font-small)" }}>
            {r.ingredients.map((ing: RecipeIngredient) => {
              const item = stock.find((s) => s.id === ing.stockItemId);
              return <li key={ing.stockItemId}>{item ? `${item.name}: ${ing.quantity} ${item.unit}` : `${ing.stockName ?? "Surovina"} už nie je v sklade, upravte recept`}</li>;
            })}
          </ul>
          {confirmId === r.id ? (
            <div>
              <p>Naozaj zmazať recept „{r.name}“?</p>
              <button onClick={() => remove(r.id)} style={btnDanger}>Zmazať</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => askCook(r)} style={btn}>Uvariť</button>{" "}
              {missingForRecipe(r, stock).length > 0 && <><button onClick={() => onMissing(r)} style={btn}>Chýbajúce na zoznam</button>{" "}</>}
              <button onClick={() => setEditing(r)} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(r.id)} style={btnDanger}>Zmazať</button>
            </>
          )}
        </div>
      ))}
      {pending && (
        <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>Uvariť „{pending.name}“?</strong> Zo skladu sa odpočíta:</p>
          <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "var(--font-small)" }}>
            {pending.ingredients.map((ing) => {
              const item = stock.find((s) => s.id === ing.stockItemId);
              return <li key={ing.stockItemId}>{`${item?.name ?? ing.stockName ?? "surovina"}: −${qtyText(ing.quantity)} ${item?.unit ?? ""}`}</li>;
            })}
          </ul>
          <button onClick={() => confirmCook(pending)} style={btn}>Odpočítať zo skladu</button>{" "}
          <button onClick={() => setPending(null)} style={btn}>Zrušiť</button>
        </div>
      )}
      {result && <p style={{ color: result.ok ? "var(--ok)" : "var(--danger)" }}>{result.text}</p>}
      {editing ? (
        <RecipeForm
          repo={repo}
          initial={editing === "new" ? null : editing}
          stock={stock}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btnPrimary}>Pridať recept</button>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}

function RecipeForm({ repo, initial, stock, onDone, onCancel }: { repo: Repository; initial: Recipe | null; stock: StockItem[]; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [rows, setRows] = useState<{ stockItemId: string; quantity: NumIn }[]>(
    initial ? initial.ingredients.map((i) => ({ stockItemId: i.stockItemId, quantity: i.quantity })) : [{ stockItemId: "", quantity: "" }],
  );
  const [err, setErr] = useState<string | null>(null);

  const updateRow = (n: number, patch: Partial<{ stockItemId: string; quantity: NumIn }>) =>
    setRows((prev) => prev.map((r, i) => (i === n ? { ...r, ...patch } : r)));
  // Jednotka vybranej suroviny, aby bolo jasné, v akom množstve sa odpočíta.
  const unitOf = (id: string) => {
    const unit = stock.find((s) => s.id === id)?.unit;
    return unit ? ` (${unit})` : "";
  };

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov receptu.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const ingredients: RecipeIngredient[] = [];
    for (const row of rows) {
      const q = asNum(row.quantity);
      if (row.stockItemId === "" || Number.isNaN(q) || !(q > 0)) return setErr("Každá surovina potrebuje položku skladu a množstvo väčšie ako 0.");
      if (ingredients.some((i) => i.stockItemId === row.stockItemId)) return setErr("Rovnaká surovina je v recepte dvakrát.");
      ingredients.push({ stockItemId: row.stockItemId, quantity: q, stockName: stock.find((s) => s.id === row.stockItemId)?.name });
    }
    const now = new Date().toISOString();
    try {
      await repo.saveRecipe({ id: initial?.id ?? uid(), name: trimmed, ingredients, createdAt: initial?.createdAt ?? now, updatedAt: now });
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "var(--font-text)", marginTop: 0 }}>{initial ? "Upraviť recept" : "Nový recept"}</h4>
      {stock.length === 0 && <p style={{ color: "var(--muted)" }}>Najprv pridajte položky do skladu.</p>}
      <Field label="Názov receptu" value={name} type="text" onChange={setName} maxLength={80} />
      {rows.map((row, n) => (
        <div key={n} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 8 }}>
          <label style={{ flex: "2 1 160px" }}>
            <span style={{ display: "block", fontSize: "var(--font-small)" }}>Surovina</span>
            <select aria-label="Surovina" value={row.stockItemId} onChange={(e) => updateRow(n, { stockItemId: e.target.value })} style={inp}>
              <option value="">vyberte</option>
              {stock.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
            </select>
          </label>
          <label style={{ flex: "1 1 90px" }}>
            <span style={{ display: "block", fontSize: "var(--font-small)" }}>Množstvo{unitOf(row.stockItemId)}</span>
            <input
              type="number"
              step="any"
              inputMode="decimal"
              aria-label="Množstvo suroviny"
              value={row.quantity}
              onChange={(e) => updateRow(n, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
              style={inp}
            />
          </label>
          <button onClick={() => setRows((prev) => (prev.length === 1 ? [{ stockItemId: "", quantity: "" }] : prev.filter((_, i) => i !== n)))} style={btn}>Odobrať</button>
        </div>
      ))}
      <button onClick={() => setRows((prev) => [...prev, { stockItemId: "", quantity: "" }])} style={btn} disabled={stock.length === 0}>Pridať surovinu</button>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <div>
        <button onClick={save} style={btnPrimary}>Uložiť recept</button>{" "}
        <button onClick={onCancel} style={btn}>Zrušiť</button>
      </div>
    </div>
  );
}
