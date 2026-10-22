import { useState } from "react";
import { STOCK_UNITS, type Recipe, type RecipeIngredient, type StockItem, type StockUnit } from "../../storage/types";
import { checkDate } from "../../storage/validate";
import type { Repository } from "../../storage/repository";
import { daysUntil, expiringItems, sortForList, stockStatus } from "../../domain/stock";
import { findExpiryDate, findProductName } from "../../domain/scan";
import { cookRecipe } from "../../domain/recipe";
import { dateSk } from "../../ui/kit/format";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { uid } from "../../ui/kit/ids";
import { Field, asNum, btn, inp, type NumIn, btnPrimary, btnDanger } from "../../ui/kit/controls";

/** Sklad potravín a recepty (D-127, D-141, D-155): položky, dátumy spotreby, uvarenie a skener obalu. Feature „sklad“ (docs/23). */

const STOCK_STATUS_TEXT: Record<string, string> = {
  prešlo: "dátum spotreby prešiel",
  blizi_sa: "dátum spotreby sa blíži",
  v_poriadku: "v poriadku",
  bez_datumu: "bez dátumu spotreby",
};

/** Sklad potravín (samostatná sekcia): položky, množstvo, dátum spotreby a upozornenia. */
/** Počet dní od dneška slovami: „dnes“, „za 1 deň“, „za 3 dni“, „pred 2 dňami“. */
function dniText(n: number): string {
  if (n === 0) return "dnes";
  if (n > 0) return `za ${n} ${n === 1 ? "deň" : n < 5 ? "dni" : "dní"}`;
  return `pred ${-n} ${-n === 1 ? "dňom" : "dňami"}`;
}

export function StockSection({ repo, items, recipes, today, onSaved }: { repo: Repository; items: StockItem[]; recipes: Recipe[]; today: string; onSaved: () => void }) {
  const [editing, setEditing] = useState<StockItem | "new" | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const warnings = expiringItems(items, today);

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

  return (
    <section>
      <p style={{ color: "var(--muted)" }}>Potraviny doma a ich dátum spotreby. Názov a dátum môžete doplniť z fotky obalu; množstvo zadajte ručne.</p>
      {warnings.length > 0 && (
        <div style={{ background: "var(--warn-bg)", padding: 8, borderRadius: 6, marginBottom: 12 }}>
          <strong>Pozor:</strong>
          <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
            {warnings.map((w) => <li key={w.id}>{w.name}: {STOCK_STATUS_TEXT[stockStatus(w, today)]} ({dateSk(w.expiryDate ?? "")})</li>)}
          </ul>
        </div>
      )}
      {items.length === 0 && editing === null && <p>Zatiaľ nie sú zapísané položky skladu.</p>}
      {sortForList(items, today).map((i) => (
        <div key={i.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{i.name}</strong></p>
          <p style={{ margin: "4px 0" }}>{i.quantity} {i.unit}{i.quantity === 0 ? " · došlo" : ""}</p>
          <p style={{ margin: "4px 0", fontSize: "0.9rem", color: "var(--muted)" }}>
            {i.expiryDate ? `Spotrebovať do ${dateSk(i.expiryDate ?? "")} (${dniText(daysUntil(today, i.expiryDate))})` : "Bez dátumu spotreby"}
            {i.expiryDate ? <>{" · "}{STOCK_STATUS_TEXT[stockStatus(i, today)]}</> : null}
          </p>
          {confirmId === i.id ? (
            <div>
              <p>Naozaj zmazať položku „{i.name}“?</p>
              {usedIn(i.id).length > 0 && (
                <p style={{ fontSize: "0.9rem" }}>Používa ju recept: {usedIn(i.id).join(", ")}. Po zmazaní bude recept hlásiť chýbajúcu surovinu.</p>
              )}
              <button onClick={() => remove(i.id)} style={btnDanger}>Zmazať</button>{" "}
              <button onClick={() => setConfirmId(null)} style={btn}>Zrušiť</button>
            </div>
          ) : (
            <>
              <button onClick={() => setEditing(i)} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(i.id)} style={btnDanger}>Zmazať</button>
            </>
          )}
        </div>
      ))}
      {editing ? (
        <StockForm
          repo={repo}
          initial={editing === "new" ? null : editing}
          onDone={() => { setEditing(null); onSaved(); }}
          onCancel={() => setEditing(null)}
        />
      ) : (
        <button onClick={() => setEditing("new")} style={btnPrimary}>Pridať položku skladu</button>
      )}
      <RecipesBlock repo={repo} recipes={recipes} stock={items} onSaved={onSaved} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}

// Množstvo v desatinnej čiarke, ako ho píše slovenský text.
const qtyText = (n: number) => String(n).replace(".", ",");

function RecipesBlock({ repo, recipes, stock, onSaved }: { repo: Repository; recipes: Recipe[]; stock: StockItem[]; onSaved: () => void }) {
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
      <h4 style={{ fontSize: "1rem" }}>Recepty</h4>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Pri uvarení sa suroviny odpočítajú zo skladu. Ak niečo chýba, nič sa neodpočíta.</p>
      {recipes.length === 0 && editing === null && <p>Zatiaľ nie sú zapísané recepty.</p>}
      {recipes.map((r) => (
        <div key={r.id} style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>{r.name}</strong></p>
          <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "0.9rem" }}>
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
              <button onClick={() => setEditing(r)} style={btn}>Upraviť</button>{" "}
              <button onClick={() => setConfirmId(r.id)} style={btnDanger}>Zmazať</button>
            </>
          )}
        </div>
      ))}
      {pending && (
        <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, marginBottom: 8, background: "var(--surface)" }}>
          <p style={{ margin: 0 }}><strong>Uvariť „{pending.name}“?</strong> Zo skladu sa odpočíta:</p>
          <ul style={{ paddingLeft: 20, margin: "4px 0", fontSize: "0.9rem" }}>
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
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť recept" : "Nový recept"}</h4>
      {stock.length === 0 && <p style={{ color: "var(--muted)" }}>Najprv pridajte položky do skladu.</p>}
      <Field label="Názov receptu" value={name} type="text" onChange={setName} />
      {rows.map((row, n) => (
        <div key={n} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 8 }}>
          <label style={{ flex: "2 1 160px" }}>
            <span style={{ display: "block", fontSize: "0.9rem" }}>Surovina</span>
            <select aria-label="Surovina" value={row.stockItemId} onChange={(e) => updateRow(n, { stockItemId: e.target.value })} style={inp}>
              <option value="">vyberte</option>
              {stock.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.unit})</option>)}
            </select>
          </label>
          <label style={{ flex: "1 1 90px" }}>
            <span style={{ display: "block", fontSize: "0.9rem" }}>Množstvo{unitOf(row.stockItemId)}</span>
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

function StockForm({ repo, initial, onDone, onCancel }: { repo: Repository; initial: StockItem | null; onDone: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [quantity, setQuantity] = useState<NumIn>(initial?.quantity ?? "");
  const [unit, setUnit] = useState<StockUnit>(initial?.unit ?? "ks");
  // Dátum spotreby sa nepredvypĺňa: prázdne pole znamená položku bez dátumu (skener ho môže doplniť).
  const [expiry, setExpiry] = useState(initial?.expiryDate ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [scanMsg, setScanMsg] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState<string | null>(null);

  // Skener: fotka obalu, offline rozpoznanie; názov a dátum sa len navrhnú, potvrdí ich používateľ.
  const onPhoto = async (file: File) => {
    setScanMsg("Rozpoznávam text z fotky…");
    try {
      const { recognizeImage } = await import("./ocr");
      const text = await recognizeImage(file);
      setOcrText(text);
      const date = findExpiryDate(text);
      const product = findProductName(text);
      if (product && name.trim() === "") setName(product);
      if (date) setExpiry(date);
      setScanMsg(date || product
        ? `Navrhnuté: ${product ?? "názov nenájdený"}, dátum spotreby ${date ?? "nenájdený"}. Skontrolujte údaje a množstvo doplňte ručne.`
        : "Text sa nepodarilo rozpoznať. Zadajte údaje ručne.");
    } catch {
      setScanMsg("Skener sa nepodarilo spustiť. Zadajte údaje ručne.");
    }
  };

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length === 0) return setErr("Vyplň názov.");
    if (trimmed.length > 80) return setErr("Názov môže mať najviac 80 znakov.");
    const q = asNum(quantity);
    if (Number.isNaN(q) || q < 0) return setErr("Vyplň množstvo (0 alebo viac).");
    if (expiry.trim() !== "") {
      const dErr = checkDate(expiry.trim(), "9999-12-31", "dátum spotreby");
      if (dErr.length) return setErr(dErr[0]);
    }
    const now = new Date().toISOString();
    const item: StockItem = {
      id: initial?.id ?? uid(),
      name: trimmed,
      quantity: q,
      unit,
      createdAt: initial?.createdAt ?? now,
      updatedAt: now,
      ...(expiry.trim() !== "" ? { expiryDate: expiry.trim() } : {}),
    };
    try {
      await repo.saveStockItem(item);
      onDone();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <div style={{ border: "1px solid var(--border-strong)", padding: 12, borderRadius: 6, background: "var(--surface)" }}>
      <h4 style={{ fontSize: "1rem", marginTop: 0 }}>{initial ? "Upraviť položku skladu" : "Nová položka skladu"}</h4>
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>Fotka obalu (navrhne názov a dátum spotreby)</span>
        <input type="file" accept="image/*" capture="environment" aria-label="Fotka obalu" onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPhoto(f); }} />
      </label>
      {scanMsg && <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{scanMsg}</p>}
      {ocrText !== null && (
        <details style={{ fontSize: "0.9rem", marginBottom: 8 }}>
          <summary>Rozpoznaný text z fotky</summary>
          <pre style={{ whiteSpace: "pre-wrap", background: "var(--surface-2)", padding: 8, borderRadius: 4 }}>{ocrText.trim() || "(žiadny text)"}</pre>
        </details>
      )}
      <Field label="Názov (napr. mlieko)" value={name} type="text" onChange={setName} />
      <Field label="Množstvo" value={quantity} step={0.01} onChange={setQuantity} />
      <label style={{ display: "block", marginBottom: 8 }}>
        Jednotka
        <select aria-label="Jednotka" value={unit} onChange={(e) => setUnit(e.target.value as StockUnit)} style={{ display: "block", minHeight: 44, width: "100%", marginTop: 4 }}>
          {STOCK_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
      <Field label="Dátum spotreby (nepovinné, bez dátumu nechajte prázdne)" value={expiry} type="date" onChange={setExpiry} />
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={save} style={btnPrimary}>Uložiť položku</button>{" "}
      <button onClick={onCancel} style={btn}>Zrušiť</button>
    </div>
  );
}
