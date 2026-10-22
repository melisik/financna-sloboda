import { useState } from "react";
import type { Repository } from "../../storage/repository";
import type { AppData } from "../../storage/types";
import { checkPin, isValidPin, makePinRecord } from "./pin";
import { Field, btn, inp } from "../../ui/kit/controls";
import { STORAGE_ERROR } from "../../ui/kit/messages";

/** Zámok a PIN (D-119, D-135): obrazovka odomknutia a zapnutie/vypnutie PIN-u v Nastaveniach. Feature „zamok“ (docs/23). */

/** Odomknutie PIN-om (D-119). Údaje sa nezobrazia, kým PIN nie je správny. */
const EMPTY_DATA: AppData = {
  settings: null, transactions: [], snapshots: [], properties: [], assets: [], investments: [], liabilities: [],
  incomes: [], budgets: [], recurringExpenses: [], stockItems: [], recipes: [], dogs: [],
};

/** Odomknutie PIN-om. Zabudnutý PIN = vymazanie dát v zariadení po dvojitom potvrdení (D-135). */
export function LockScreen({ repo, onUnlock, onWiped }: { repo: Repository; onUnlock: () => void; onWiped: () => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [forgot, setForgot] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const unlock = async () => {
    const record = await repo.getMeta("pin");
    if (record && (await checkPin(pin, record))) return onUnlock();
    setErr("Nesprávny PIN. Skús znova.");
    setPin("");
  };
  const wipe = async () => {
    try {
      await repo.replaceAll(EMPTY_DATA);
      await repo.replaceAttachments([]);
      await repo.setMeta("pin", "");
      onWiped();
    } catch {
      setErr(STORAGE_ERROR);
    }
  };
  return (
    <section aria-label="Odomknutie">
      <h2 style={{ fontSize: "1.1rem" }}>Zadaj PIN</h2>
      <p style={{ color: "var(--muted)" }}>Údaje sú v tomto telefóne. Ak PIN zabudneš, môžeš údaje v zariadení vymazať a obnoviť ich zo zálohy.</p>
      <label style={{ display: "block", margin: "8px 0" }}>
        <span style={{ display: "block", fontSize: "0.9rem" }}>PIN</span>
        <input type="password" inputMode="numeric" aria-label="PIN" value={pin} onChange={(e) => setPin(e.target.value)} style={inp} />
      </label>
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
      <button onClick={unlock} style={btn}>Odomknúť</button>
      {!forgot ? (
        <p><button onClick={() => setForgot(true)} style={{ ...btn, marginTop: 16 }}>Zabudol som PIN</button></p>
      ) : (
        <div style={{ border: "1px solid var(--border)", padding: 12, borderRadius: 6, marginTop: 12 }}>
          <p><strong>Údaje v tomto zariadení sa vymažú a PIN sa zruší.</strong> Bez zálohy sa údaje nedajú obnoviť. Ak zálohu máš, po vymazaní ju môžeš importovať v sekcii Záloha.</p>
          <label style={{ display: "block", margin: "8px 0" }}>
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />{" "}
            Rozumiem, že údaje v tomto zariadení sa vymažú
          </label>
          <button onClick={wipe} disabled={!understood} style={btn}>Vymazať údaje a zrušiť PIN</button>{" "}
          <button onClick={() => { setForgot(false); setUnderstood(false); }} style={btn}>Zrušiť</button>
        </div>
      )}
    </section>
  );
}

/** Zapnutie, vypnutie a zamknutie PIN-u v Nastaveniach (D-119). */
export function PinSection({ repo, pinSet, onChanged, onLock }: { repo: Repository; pinSet: boolean; onChanged: (on: boolean) => void; onLock: () => void }) {
  const [newPin, setNewPin] = useState("");
  const [repeat, setRepeat] = useState("");
  const [current, setCurrent] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const enable = async () => {
    if (!isValidPin(newPin)) return setErr("PIN musí mať 4 až 6 číslic.");
    if (newPin !== repeat) return setErr("PIN sa nezhoduje so zopakovaním.");
    try {
      await repo.setMeta("pin", await makePinRecord(newPin));
      setNewPin("");
      setRepeat("");
      setErr(null);
      onChanged(true);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  const disable = async () => {
    const record = await repo.getMeta("pin");
    if (!record || !(await checkPin(current, record))) return setErr("Aktuálny PIN nesedí.");
    try {
      await repo.setMeta("pin", "");
      setCurrent("");
      setErr(null);
      onChanged(false);
    } catch {
      setErr(STORAGE_ERROR);
    }
  };

  return (
    <section style={{ marginTop: 16 }}>
      <h3 style={{ fontSize: "1rem" }}>PIN</h3>
      {pinSet ? (
        <>
          <p style={{ color: "var(--muted)" }}>PIN je zapnutý. Appka sa pri otvorení najprv opýta na PIN. PIN chráni prístup v tomto telefóne; údaje nie sú zašifrované.</p>
          <button onClick={onLock} style={btn}>Zamknúť teraz</button>
          <Field label="Aktuálny PIN (na vypnutie)" value={current} type="password" inputMode="numeric" onChange={setCurrent} />
          <button onClick={disable} style={btn}>Vypnúť PIN</button>
        </>
      ) : (
        <>
          <p style={{ color: "var(--muted)" }}>PIN je nepovinný. Údaje nie sú zašifrované; PIN bráni len otvoreniu appky.</p>
          <Field label="Nový PIN (4 až 6 číslic)" value={newPin} type="password" inputMode="numeric" onChange={setNewPin} />
          <Field label="Zopakuj PIN" value={repeat} type="password" inputMode="numeric" onChange={setRepeat} />
          <button onClick={enable} style={btn}>Zapnúť PIN</button>
        </>
      )}
      {err && <p style={{ color: "var(--danger)" }}>{err}</p>}
    </section>
  );
}
