import { useState } from "react";
import type { ShoppingItem } from "../../storage/types";
import type { Repository } from "../../storage/repository";
import { addToShoppingList, shoppingText } from "../../domain/shopping";
import { STORAGE_ERROR } from "../../ui/kit/messages";
import { uid } from "../../ui/kit/ids";
import { btn, btnPrimary, hintStyle, inp } from "../../ui/kit/controls";

const qtyText = (s: ShoppingItem) => (s.quantity !== undefined ? ` · ${String(s.quantity).replace(".", ",")}${s.unit ? ` ${s.unit}` : ""}` : "");

/**
 * Nákupný zoznam v Sklade (D-302, docs/51 3.5): ručne, z receptu alebo keď položka dôjde. Kúpené sa dá jedným ťuknutím
 * pridať do skladu. Zoznam sa pošle ako text cez zdieľanie; nič sa neodosiela samo. Nemení výdavky ani rozpočet.
 */
export function ShoppingList({ repo, items, onToStock, onSaved }: { repo: Repository; items: ShoppingItem[]; onToStock: (s: ShoppingItem) => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [text, setText] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    try {
      await fn();
      setErr(null);
      onSaved();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const add = () => {
    if (name.trim() === "") return setErr("Napíš, čo treba kúpiť.");
    const added = addToShoppingList(items, [{ name }], new Date().toISOString(), uid);
    setName("");
    if (added.length === 0) return setErr("Táto položka už na zozname je.");
    void run(() => repo.saveShoppingItems(added));
  };

  const send = async () => {
    const t = shoppingText(items);
    // Zdieľací list (napr. do správy); bez neho sa ukáže text na skopírovanie.
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Nakúpiť", text: t });
        return;
      } catch (e) {
        if ((e as { name?: string })?.name === "AbortError") return;
      }
    }
    setText(t);
  };

  const open = items.filter((s) => !s.done).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const done = items.filter((s) => s.done).sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  return (
    <div style={{ margin: "16px 0" }}>
      <h4 style={{ fontSize: "var(--font-text)", marginBottom: 4 }}>Nakúpiť</h4>
      {items.length === 0 && <p style={hintStyle}>Zoznam je prázdny. Položky pridáš ručne, z receptu alebo keď niečo dôjde.</p>}
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {[...open, ...done].map((s) => (
          <li key={s.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <label style={{ flex: "1 1 180px", textDecoration: s.done ? "line-through" : undefined }}>
              <input type="checkbox" checked={s.done} onChange={(e) => void run(() => repo.saveShoppingItems([{ ...s, done: e.target.checked, updatedAt: new Date().toISOString() }]))} /> {s.name}
              <span style={hintStyle}>{qtyText(s)}</span>
            </label>
            {s.done && <button onClick={() => onToStock(s)} aria-label={`Do skladu: ${s.name}`} style={btn}>Do skladu</button>}
          </li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap", marginTop: 8 }}>
        <label style={{ flex: "1 1 200px" }}>
          <span style={{ display: "block", fontSize: "var(--font-small)" }}>Pridať na zoznam</span>
          <input type="text" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} style={inp} />
        </label>
        <button onClick={add} style={btn}>Pridať</button>
      </div>
      {open.length > 0 && <button onClick={() => void send()} style={btnPrimary}>Poslať zoznam</button>}{" "}
      {done.length > 0 && <button onClick={() => void run(() => repo.deleteShoppingItems(done.map((s) => s.id)))} style={btn}>Odstrániť kúpené</button>}
      {text !== null && (
        <label style={{ display: "block", marginTop: 8 }}>
          <span style={{ display: "block", fontSize: "var(--font-small)" }}>Text zoznamu (skopíruj ho do správy)</span>
          <textarea aria-label="Text zoznamu" readOnly value={text} rows={Math.min(10, text.split("\n").length + 1)} style={{ ...inp, fontFamily: "inherit" }} />
        </label>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </div>
  );
}
